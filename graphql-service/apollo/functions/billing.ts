import { AccountActivity, Pricing, UsageSummary } from "../dynamoose/models";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { RequestContext } from "../RequestContext";
import Decimal from "decimal.js-light";
import { collectUsageLogs } from "./usage";
import { Chalk } from "chalk";
import { settleAccountActivities } from "./account";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { AppPK } from "../pks/AppPK";
import { PricingPK } from "../pks/PricingPK";
const chalk = new Chalk({ level: 3 });

export type GenerateAccountActivitiesResult = {
    newUsageSummary: UsageSummary;
    createdAccountActivities: {
        subscriberRequestFee: AccountActivity;
        appAuthorRequestFee: AccountActivity;
        subscriberMonthlyFee?: AccountActivity;
        appAuthorMonthlyFee?: AccountActivity;
        appAuthorServiceFee: AccountActivity;
    };
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
        serviceFeePerRequest = "0.0001",
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
    let promises = [];
    let results = {
        createdAccountActivities: {} as GenerateAccountActivitiesResult["createdAccountActivities"],
    } as GenerateAccountActivitiesResult;
    let pricing = await context.batched.Pricing.get(PricingPK.parse(usageSummary.pricing));
    {
        // Process per-request charge
        let volume = usageSummary.volume;
        let price = new Decimal(pricing.chargePerRequest);
        usageSummary.status = "billed";
        usageSummary.billedAt = Date.now();
        results.newUsageSummary = usageSummary;

        let subscriberPerRequestActivityPromise = context.batched.AccountActivity.create({
            user: subscriber,
            type: "credit",
            reason: "api_per_request_charge",
            status: "pending",
            settleAt: Date.now(),
            amount: price.mul(volume).toString(),
            usageSummary: UsageSummaryPK.stringify(usageSummary),
            description: `API request charge`,
            billedApp: usageSummary.app,
        }).then(async (activity) => {
            results.createdAccountActivities.subscriberRequestFee = activity;
            usageSummary.billingAccountActivity = AccountActivityPK.stringify(activity);
            await usageSummary.save();
            results.newUsageSummary = usageSummary;
            return activity;
        });

        let appAuthorPerRequestActivityPromise = context.batched.AccountActivity.create({
            user: appAuthor,
            type: "debit",
            reason: "api_per_request_charge",
            status: "pending",
            settleAt: Date.now(),
            amount: price.mul(volume).toString(),
            usageSummary: UsageSummaryPK.stringify(usageSummary),
            description: `API request charge paid by customer`,
            billedApp: usageSummary.app,
        }).then((activity) => {
            results.createdAccountActivities.appAuthorRequestFee = activity;
            return activity;
        });

        let appAuthorServiceFeePerRequestActivityPromise = context.batched.AccountActivity.create({
            user: appAuthor,
            type: "credit",
            reason: "fastchargeapi_per_request_service_fee",
            status: "pending",
            settleAt: Date.now(),
            amount: new Decimal(serviceFeePerRequest).mul(volume).toString(),
            usageSummary: UsageSummaryPK.stringify(usageSummary),
            description: `API request service fee`,
            billedApp: usageSummary.app,
        }).then((activity) => {
            results.createdAccountActivities.appAuthorServiceFee = activity;
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
        let {
            shouldBill: shouldBillMonthly,
            amount: monthlyBill,
            isUpgrade,
        } = await shouldCollectMonthlyCharge(context, {
            subscriber,
            app: usageSummary.app,
            pricing: pricing,
        });
        if (forceMonthlyCharge || (!disableMonthlyCharge && shouldBillMonthly)) {
            let subscriberMonthlyActivityPromise = context.batched.AccountActivity.create({
                user: subscriber,
                type: "credit",
                reason: isUpgrade ? "api_min_monthly_charge_upgrade" : "api_min_monthly_charge",
                status: "pending",
                settleAt: Date.now(), // We want to charge the subscriber immediately
                amount: forceMonthlyCharge ? pricing.minMonthlyCharge : monthlyBill.toString(),
                usageSummary: UsageSummaryPK.stringify(usageSummary),
                description: `API subscription fee every 30 days`,
                billedApp: usageSummary.app,
            }).then((activity) => {
                results.createdAccountActivities.subscriberMonthlyFee = activity;
                return activity;
            });

            let appAuthorMonthlyActivityPromise = context.batched.AccountActivity.create({
                user: appAuthor,
                type: "debit",
                reason: isUpgrade ? "api_min_monthly_charge_upgrade" : "api_min_monthly_charge",
                status: "pending",
                settleAt: Date.now() + 1000 * monthlyChargeOnHoldPeriodInSeconds,
                amount: forceMonthlyCharge ? pricing.minMonthlyCharge : monthlyBill.toString(),
                usageSummary: UsageSummaryPK.stringify(usageSummary),
                description: `API subscription fee paid by customer`,
                billedApp: usageSummary.app,
            }).then((activity) => {
                results.createdAccountActivities.appAuthorMonthlyFee = activity;
                return activity;
            });

            promises.push(subscriberMonthlyActivityPromise, appAuthorMonthlyActivityPromise);
        }
    }
    let errors: string[] = [];
    for (let result of await Promise.allSettled(promises)) {
        if (result.status === "rejected") {
            console.error("Error creating AccountActivity:", result.reason, "for usage summary:", usageSummary);
            errors.push(result.reason);
        }
    }
    if (errors.length > 0) {
        throw new Error("Error creating AccountActivity.");
    }
    return results;
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
    { subscriber, app, pricing }: { subscriber: string; app: string; pricing: Pricing },
    {
        collectionPeriodInSeconds = 60 * 60 * 24 * 30, // default to 30 days
    }: { collectionPeriodInSeconds?: number } = {}
): Promise<ShouldCollectMonthlyChargePromiseResult> {
    let allBillsThisMonth = await context.batched.AccountActivity.many({
        user: subscriber,
        billedApp: app,
        type: "credit",
        reason: "api_min_monthly_charge",
        settleAt: { ge: Date.now() - 1000 * collectionPeriodInSeconds }, // get the last bill in 30 days
    });
    let totalPaidThisMonth = new Decimal(0);
    for (let bill of allBillsThisMonth) {
        totalPaidThisMonth = totalPaidThisMonth.add(bill.amount);
    }
    let currMonthlyCharge = new Decimal(pricing.minMonthlyCharge);
    let diff = currMonthlyCharge.sub(totalPaidThisMonth);
    if (diff.gt(0)) {
        return {
            shouldBill: true,
            amount: diff.toString(),
            isUpgrade: true,
        };
    } else {
        return {
            shouldBill: false,
            amount: "0",
            isUpgrade: false,
        };
    }
}

/**
 * Start collecting UsageLogs for the given app, computes the UsageSummary, and
 * creates AccountActivities for both the subscriber and the app author.
 * Finally, settles the AccountActivities. This function has the effect of
 * cleaning up all the UsageLogs and UsageSummary that are in the pending state.
 * It creates AccountActivities for the subscriber and the app author, and set
 * the settleAt field to the different time for the subscriber and the app
 * author. It also settles all pending AccountActivities that have the settleAt
 * value in the past.
 *
 * @idempotent Yes
 * @workerSafe No - Only can be called on a single worker queue.
 */
export async function triggerBilling(
    context: RequestContext,
    { user, app }: { user: string; app: string }
): Promise<{ affectedUsageSummaries: UsageSummary[] }> {
    if (!context.isSQSMessage) {
        if (!process.env.UNSAFE_BILLING) {
            console.error(
                chalk.red(
                    `triggerBilling must be called from an SQS message. If you are not running in production, you can set the UNSAFE_BILLING=1 environment variable to bypass this check.`
                )
            );
            throw new Error("triggerBilling must be called from an SQS message");
        }
    }

    await collectUsageLogs(context, { user, app });
    let uncollectedUsageSummaries = await context.batched.UsageSummary.many({
        subscriber: user,
        app,
        status: "pending",
    });

    let appItem = await context.batched.App.get(AppPK.parse(app));

    let promises = [];
    for (let usageSummary of uncollectedUsageSummaries) {
        promises.push(
            generateAccountActivities(context, {
                usageSummary,
                subscriber: user,
                appAuthor: appItem.owner,
            })
        );
    }
    await Promise.allSettled(promises);

    await settleAccountActivities(context, user, {
        consistentReadAccountActivities: true,
    });
    await settleAccountActivities(context, appItem.owner, {
        consistentReadAccountActivities: true,
    });
    return {
        affectedUsageSummaries: uncollectedUsageSummaries,
    };
}
