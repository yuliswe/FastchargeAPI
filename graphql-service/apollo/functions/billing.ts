import { AccountActivity } from "@/database/models/AccountActivity";
import { FreeQuotaUsage } from "@/database/models/FreeQuotaUsage";
import { Pricing } from "@/database/models/Pricing";
import { UsageSummary } from "@/database/models/UsageSummary";
import { PK } from "@/database/utils";
import { settlePromisesInBatches } from "@/functions/promise";
import { SQSQueueName } from "@/sqsClient";
import Decimal from "decimal.js-light";
import { RequestContext } from "../RequestContext";
import {
  AccountActivityReason,
  AccountActivityStatus,
  AccountActivityType,
  UsageSummaryStatus,
} from "../__generated__/resolvers-types";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { AppPK } from "../pks/AppPK";
import { PricingPK } from "../pks/PricingPK";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { settleAccountActivitiesOnSQS } from "./account";
import { enforceCalledFromSQS } from "./aws";
import { collectUsageLogs } from "./usage";

export const fastchargeRequestServiceFee = "0.0001";

export type GenerateAccountActivitiesResult = {
  updatedUsageSummary: UsageSummary;
  createdAccountActivities: {
    subscriberRequestFee: AccountActivity;
    appAuthorRequestFee: AccountActivity;
    subscriberMonthlyFee: AccountActivity | null;
    appAuthorMonthlyFee: AccountActivity | null;
    appAuthorServiceFee: AccountActivity;
  };
  affectedFreeQuotaUsage: FreeQuotaUsage | null;
  volumeFree: number;
  volumeBilled: number;
};
/**
 * Create account activities for API usage and the app author, taking into
 * account the per request charge, and the min monthly charge.
 * @param context
 * @param usageSummary The API call usage summary
 * @param subscriber API caller
 * @param appAuthor API author
 * @returns { subscriber: AccountActivity, appAuthor: AccountActivity }
 */
export async function generateAccountActivities(
  context: RequestContext,
  {
    usageSummary,
    subscriber,
    appAuthor,
    monthlyChargeOnHoldPeriodInSeconds = 60 * 60 * 24 * 30, // default to 30 days
    disableMonthlyCharge = false, // for testing purpose
    forceMonthlyCharge = false, // for testing purpose
    serviceFeePerRequest = fastchargeRequestServiceFee,
  }: {
    usageSummary: UsageSummary;
    subscriber: string;
    appAuthor: string;
    monthlyChargeOnHoldPeriodInSeconds?: number;
    disableMonthlyCharge?: boolean;
    forceMonthlyCharge?: boolean;
    serviceFeePerRequest?: string;
  }
): Promise<GenerateAccountActivitiesResult> {
  const promises = [];
  const results: Partial<GenerateAccountActivitiesResult> = {
    createdAccountActivities: {
      subscriberMonthlyFee: null,
      appAuthorMonthlyFee: null,
    } as GenerateAccountActivitiesResult["createdAccountActivities"],
    affectedFreeQuotaUsage: null,
  };
  const pricing = await context.batched.Pricing.getOrNull(PricingPK.parse(usageSummary.pricing));
  if (pricing == null) {
    // Pricing was deleted
    await context.batched.UsageSummary.update(usageSummary, {
      status: UsageSummaryStatus.Error,
    });
    throw new Error("Could not generate account activity for usage summary. Pricing was deleted.");
  }
  const { volumeFree, volumeBillable, freeQuotaUsage } = await computeBillableVolume(context, {
    app: usageSummary.app,
    subscriber,
    volume: usageSummary.volume,
    pricingFreeQuota: pricing.freeQuota,
  });
  results.volumeFree = volumeFree;
  results.volumeBilled = volumeBillable;
  // Update free quota usage
  if (volumeFree > 0) {
    promises.push(
      context.batched.FreeQuotaUsage.update(freeQuotaUsage, {
        $ADD: { usage: volumeFree },
      }).then((freeQuotaUsage) => {
        results.affectedFreeQuotaUsage = freeQuotaUsage;
      })
    );
  }
  {
    // Process per-request charge
    const price = new Decimal(pricing.chargePerRequest);
    usageSummary.status = UsageSummaryStatus.Billed;
    usageSummary.billedAt = Date.now();
    results.updatedUsageSummary = usageSummary;

    const subscriberPerRequestActivityPromise = context.batched.AccountActivity.create({
      user: subscriber,
      type: AccountActivityType.Outgoing,
      reason: AccountActivityReason.ApiPerRequestCharge,
      status: AccountActivityStatus.Pending,
      settleAt: Date.now(),
      amount: price.mul(volumeBillable).toString(),
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      description: `API request charge`,
      billedApp: usageSummary.app,
      consumedFreeQuota: volumeFree,
    }).then((activity) => {
      results.createdAccountActivities!.subscriberRequestFee = activity;
      usageSummary.billingRequestChargeAccountActivity = AccountActivityPK.stringify(activity);
      results.updatedUsageSummary = usageSummary;
      return activity;
    });

    const appAuthorPerRequestActivityPromise = context.batched.AccountActivity.create({
      user: appAuthor,
      type: AccountActivityType.Incoming,
      reason: AccountActivityReason.ApiPerRequestCharge,
      status: AccountActivityStatus.Pending,
      settleAt: Date.now(),
      amount: price.mul(volumeBillable).toString(),
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      description: `API request charge paid by customer`,
      billedApp: usageSummary.app,
      consumedFreeQuota: volumeFree,
    }).then((activity) => {
      results.createdAccountActivities!.appAuthorRequestFee = activity;
      usageSummary.appOwnerRequestChargeAccountActivity = AccountActivityPK.stringify(activity);
      return activity;
    });

    const appAuthorServiceFeePerRequestActivityPromise = context.batched.AccountActivity.create({
      user: appAuthor,
      type: AccountActivityType.Outgoing,
      reason: AccountActivityReason.FastchargeapiPerRequestServiceFee,
      status: AccountActivityStatus.Pending,
      settleAt: Date.now(),
      amount: new Decimal(serviceFeePerRequest).mul(usageSummary.volume).toString(), // We charge by the total volume regardless of free quota
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      description: `API request service fee`,
      billedApp: usageSummary.app,
    }).then((activity) => {
      results.createdAccountActivities!.appAuthorServiceFee = activity;
      usageSummary.appOwnerServiceFeeAccountActivity = AccountActivityPK.stringify(activity);
      return activity;
    });

    promises.push(
      subscriberPerRequestActivityPromise,
      appAuthorPerRequestActivityPromise,
      appAuthorServiceFeePerRequestActivityPromise
    );
  }
  {
    // Process min monthly charge
    const {
      shouldBill: shouldBillMonthly,
      amount: monthlyBill,
      isUpgrade,
    } = await shouldCollectMonthlyCharge(context, {
      subscriber,
      app: usageSummary.app,
      pricing: pricing,
      volumeBillable,
    });
    if (forceMonthlyCharge || (!disableMonthlyCharge && shouldBillMonthly)) {
      const subscriberMonthlyActivityPromise = context.batched.AccountActivity.create({
        user: subscriber,
        type: AccountActivityType.Outgoing,
        reason: isUpgrade
          ? AccountActivityReason.ApiMinMonthlyChargeUpgrade
          : AccountActivityReason.ApiMinMonthlyCharge,
        status: AccountActivityStatus.Pending,
        settleAt: Date.now(), // We want to charge the subscriber immediately
        amount: forceMonthlyCharge ? pricing.minMonthlyCharge : monthlyBill.toString(),
        usageSummary: UsageSummaryPK.stringify(usageSummary),
        description: `API subscription fee every 30 days`,
        billedApp: usageSummary.app,
      }).then((activity) => {
        results.createdAccountActivities!.subscriberMonthlyFee = activity;
        usageSummary.billingMonthlyChargeAccountActivity = AccountActivityPK.stringify(activity);
        return activity;
      });

      const appAuthorMonthlyActivityPromise = context.batched.AccountActivity.create({
        user: appAuthor,
        type: AccountActivityType.Incoming,
        reason: isUpgrade
          ? AccountActivityReason.ApiMinMonthlyChargeUpgrade
          : AccountActivityReason.ApiMinMonthlyCharge,
        status: AccountActivityStatus.Pending,
        settleAt: Date.now() + 1000 * monthlyChargeOnHoldPeriodInSeconds,
        amount: forceMonthlyCharge ? pricing.minMonthlyCharge : monthlyBill.toString(),
        usageSummary: UsageSummaryPK.stringify(usageSummary),
        description: `API subscription fee paid by customer`,
        billedApp: usageSummary.app,
      }).then((activity) => {
        results.createdAccountActivities!.appAuthorMonthlyFee = activity;
        usageSummary.appOwnerMonthlyChargeAccountActivity = AccountActivityPK.stringify(activity);
        return activity;
      });

      promises.push(subscriberMonthlyActivityPromise, appAuthorMonthlyActivityPromise);
    }
  }
  const errors: string[] = [];
  for (const result of await Promise.allSettled(promises)) {
    if (result.status === "rejected") {
      console.error("Error creating AccountActivity:", result.reason, "for usage summary:", usageSummary);
      errors.push(result.reason as string);
    }
  }
  await usageSummary.save();
  if (errors.length > 0) {
    throw new Error("Error creating AccountActivity.");
  }
  return results as GenerateAccountActivitiesResult;
}

export type ShouldCollectMonthlyChargePromiseResult = {
  shouldBill: boolean;
  amount: string;
  isUpgrade: boolean;
};

/**
 * Checks whether this user should be billed the monthly fee when making a
 * request to the app. Also takes into account the case where the user upgraded
 * their plan from a cheaper plan to a more expensive plan.
 *
 * @returns The amount that should be billed. In the case of an upgrade, this is
 * the additional amount that should be billed.
 */
export async function shouldCollectMonthlyCharge(
  context: RequestContext,
  { subscriber, app, pricing, volumeBillable }: { subscriber: PK; app: PK; pricing: Pricing; volumeBillable: number },
  {
    collectionPeriodInSeconds = 60 * 60 * 24 * 30, // default to 30 days
  }: { collectionPeriodInSeconds?: number } = {}
): Promise<ShouldCollectMonthlyChargePromiseResult> {
  if (volumeBillable === 0) {
    return {
      shouldBill: false,
      amount: "0",
      isUpgrade: false,
    };
  }
  const allBillsThisMonth = await context.batched.AccountActivity.many({
    user: subscriber,
    billedApp: app,
    type: AccountActivityType.Outgoing,
    reason: AccountActivityReason.ApiMinMonthlyCharge,
    settleAt: { ge: Date.now() - 1000 * collectionPeriodInSeconds }, // get the last bill in 30 days
  });
  let totalPaidThisMonth = new Decimal(0);
  for (const bill of allBillsThisMonth) {
    totalPaidThisMonth = totalPaidThisMonth.add(bill.amount);
  }
  const currMonthlyCharge = new Decimal(pricing.minMonthlyCharge);
  const diff = currMonthlyCharge.sub(totalPaidThisMonth);
  if (diff.gt(0)) {
    return {
      shouldBill: true,
      amount: diff.toString(),
      isUpgrade: allBillsThisMonth.length > 0,
    };
  } else {
    return {
      shouldBill: false,
      amount: "0",
      isUpgrade: false,
    };
  }
}

export type ComputeBillableVolumeResult = {
  volumeFree: number;
  volumeBillable: number;
  freeQuotaUsage: FreeQuotaUsage;
};
/**
 * Given the total volume of requests, compute the volume that is free and the
 * volume that is billable.
 * @returns the volumes, and the FreeQuotaUsage object that was used to compute
 */
export async function computeBillableVolume(
  context: RequestContext,
  { app, subscriber, volume, pricingFreeQuota }: { app: PK; subscriber: PK; volume: number; pricingFreeQuota: number }
): Promise<ComputeBillableVolumeResult> {
  const freeQuotaUsage = await context.batched.FreeQuotaUsage.getOrNull({
    subscriber,
    app,
  }).then((item) => {
    if (item == null) {
      return context.batched.FreeQuotaUsage.create({
        subscriber,
        app,
        usage: 0,
      });
    }
    return item;
  });
  const volumeFree = Math.min(volume, Math.max(0, pricingFreeQuota - freeQuotaUsage.usage));
  const volumeBillable = volume - volumeFree;
  return {
    volumeFree,
    volumeBillable,
    freeQuotaUsage,
  };
}

/**
 * Start collecting UsageLogs for the given app, computes the UsageSummary, and
 * creates AccountActivities for both the subscriber and the app author.
 * Finally, settles the AccountActivities. This function has the effect of
 * cleaning up all the UsageLogs and UsageSummary that are in the pending state.
 * It creates AccountActivities for the subscriber and the app author, and set
 * the settleAt field to the different time for the subscriber and the app
 * author. It also settles on SQS all pending AccountActivities that have the
 * settleAt value in the past.
 *
 * @idempotent Yes
 * @workerSafe No - Only can be called on a single worker queue.
 */
export async function sqsTriggerBilling(
  context: RequestContext,
  args: { user: PK; app: PK }
): Promise<{ affectedUsageSummaries: UsageSummary[] }> {
  const { user, app } = args;
  enforceCalledFromSQS(context, {
    queueName: SQSQueueName.UsageLogQueue,
    groupId: user,
  });
  await collectUsageLogs(context, { user, app });
  const uncollectedUsageSummaries = await context.batched.UsageSummary.many({
    subscriber: user,
    app,
    status: UsageSummaryStatus.Pending,
  });

  const appItem = await context.batched.App.get(AppPK.parse(app));

  await settlePromisesInBatches(
    uncollectedUsageSummaries,
    (usageSummary) =>
      generateAccountActivities(context, {
        usageSummary,
        subscriber: user,
        appAuthor: appItem.owner,
      }),
    {
      batchSize: 10,
    }
  );

  await Promise.all([settleAccountActivitiesOnSQS(user), settleAccountActivitiesOnSQS(appItem.owner)]);
  return {
    affectedUsageSummaries: uncollectedUsageSummaries,
  };
}
