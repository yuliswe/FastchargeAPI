import { AccountActivity, Pricing, UsageSummary } from "../dynamoose/models";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { RequestContext } from "../RequestContext";
import Decimal from "decimal.js-light";
import { findUserSubscriptionPricing } from "./subscription";
import { collectUsageLogs } from "./usage";
import { Chalk } from "chalk";
import { getAppAuthorUser } from "./app";
import { UserPK } from "../pks/UserPK";
import { settleAccountActivities } from "./account";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { AppPK } from "./AppPK";
const chalk = new Chalk({ level: 3 });

export type GenerateAccountActivitiesResult = {
    newUsageSummary: UsageSummary;
    createdAccountActivities: {
        subscriberRequestFee: AccountActivity;
        appAuthorRequestFee: AccountActivity;
        subscriberMonthlyFee?: AccountActivity;
        appAuthorMonthlyFee?: AccountActivity;
    };
};
/**
 * Create account activities for API usage and the app author, taking into
 * account the per request charge, and the min monthly charge.
 * @param context
 * @param usageSummary The API call usage summary
 * @param pricing The pricng plan which the price is based on
 * @param subscriber API caller
 * @param appAuthor API author
 * @returns { subscriber: AccountActivity, appAuthor: AccountActivity }
 */
export async function generateAccountActivities(
    context: RequestContext,
    {
        usageSummary,
        pricing,
        subscriber,
        appAuthor,
        monthlyChargeOnHoldPeriodInSeconds = 60 * 60 * 24 * 30, // default to 30 days
        disableMonthlyCharge = false, // for testing purpose
        forceMonthlyCharge = false, // for testing purpose
    }: {
        usageSummary: UsageSummary;
        pricing: Pricing;
        subscriber: string;
        appAuthor: string;
        monthlyChargeOnHoldPeriodInSeconds?: number;
        disableMonthlyCharge?: boolean;
        forceMonthlyCharge?: boolean;
    }
): Promise<GenerateAccountActivitiesResult> {
    let promises = [];
    let results = {
        createdAccountActivities:
            {} as GenerateAccountActivitiesResult["createdAccountActivities"],
    } as GenerateAccountActivitiesResult;
    {
        // Process per-request charge
        let volume = usageSummary.volume;
        let price = new Decimal(pricing.chargePerRequest);
        let amount = price.mul(volume);
        usageSummary.status = "billed";
        usageSummary.billedAt = Date.now();
        results.newUsageSummary = usageSummary;

        let subscriberPerRequestActivityPromise =
            context.batched.AccountActivity.create({
                user: subscriber,
                type: "credit",
                reason: "api_per_request_charge",
                status: "pending",
                settleAt: Date.now(),
                amount: amount.toString(),
                usageSummary: UsageSummaryPK.stringify(usageSummary),
                description: `API request charge`,
                billedApp: usageSummary.app,
            }).then(async (activity) => {
                results.createdAccountActivities.subscriberRequestFee =
                    activity;
                usageSummary.billingAccountActivity =
                    AccountActivityPK.stringify(activity);
                await usageSummary.save();
                results.newUsageSummary = usageSummary;
                return activity;
            });

        let appAuthorPerRequestActivityPromise =
            context.batched.AccountActivity.create({
                user: appAuthor,
                type: "debit",
                reason: "api_per_request_charge",
                status: "pending",
                settleAt: Date.now(),
                amount: amount.toString(),
                usageSummary: UsageSummaryPK.stringify(usageSummary),
                description: `API request charge paid by customer`,
                billedApp: usageSummary.app,
            }).then((activity) => {
                results.createdAccountActivities.appAuthorRequestFee = activity;
                return activity;
            });

        promises.push(
            subscriberPerRequestActivityPromise,
            appAuthorPerRequestActivityPromise
        );
    }
    {
        // Process min monthly charge
        let { shouldBill, amount, isUpgrade } =
            await shouldCollectMonthlyCharge(context, {
                subscriber,
                app: usageSummary.app,
            });
        if (forceMonthlyCharge || (!disableMonthlyCharge && shouldBill)) {
            let subscriberMonthlyActivityPromise =
                context.batched.AccountActivity.create({
                    user: subscriber,
                    type: "credit",
                    reason: isUpgrade
                        ? "api_min_monthly_charge_upgrade"
                        : "api_min_monthly_charge",
                    status: "pending",
                    settleAt: Date.now(), // We want to charge the subscriber immediately
                    amount: amount.toString(),
                    usageSummary: UsageSummaryPK.stringify(usageSummary),
                    description: `API subscription fee every 30 days`,
                    billedApp: usageSummary.app,
                }).then((activity) => {
                    results.createdAccountActivities.subscriberMonthlyFee =
                        activity;
                    return activity;
                });

            let appAuthorMonthlyActivityPromise =
                context.batched.AccountActivity.create({
                    user: appAuthor,
                    type: "debit",
                    reason: isUpgrade
                        ? "api_min_monthly_charge_upgrade"
                        : "api_min_monthly_charge",
                    status: "pending",
                    settleAt:
                        Date.now() + 1000 * monthlyChargeOnHoldPeriodInSeconds,
                    amount: amount.toString(),
                    usageSummary: UsageSummaryPK.stringify(usageSummary),
                    description: `API subscription fee paid by customer`,
                    billedApp: usageSummary.app,
                }).then((activity) => {
                    results.createdAccountActivities.appAuthorMonthlyFee =
                        activity;
                    return activity;
                });

            promises.push(
                subscriberMonthlyActivityPromise,
                appAuthorMonthlyActivityPromise
            );
        }
    }
    let errors: string[] = [];
    for (let result of await Promise.allSettled(promises)) {
        if (result.status === "rejected") {
            console.error(
                "Error creating AccountActivity:",
                result.reason,
                "for usage summary:",
                usageSummary
            );
            errors.push(result.reason);
        }
    }
    if (errors.length > 0) {
        throw new Error("Error creating AccountActivity.");
    }
    return results;
}

/**
 * Checks whether this user should be billed the monthly fee when making a
 * request to the app. Also takes into account the case where the user upgraded
 * their plan from a cheaper plan to a more expensive plan.
 *
 * Throws error if the user is not subscribed to the app.
 *
 * @returns The amount that should be billed. In the case of an upgrade, this is
 * the additional amount that should be billed.
 */
async function shouldCollectMonthlyCharge(
    context: RequestContext,
    { subscriber, app }: { subscriber: string; app: string },
    {
        collectionPeriodInSeconds = 60 * 60 * 24 * 30, // default to 30 days
    }: { collectionPeriodInSeconds?: number } = {}
): Promise<{ shouldBill: boolean; amount: string; isUpgrade: boolean }> {
    let lastBill = await context.batched.AccountActivity.getOrNull(
        {
            user: subscriber,
            billedApp: app,
            type: "credit",
            reason: "api_min_monthly_charge",
            settleAt: { le: Date.now() - collectionPeriodInSeconds }, // get the last bill in 30 days
        },
        {
            limit: 1,
        }
    );
    let pricing = await findUserSubscriptionPricing(context, {
        user: subscriber,
        app,
    });
    if (!pricing) {
        throw new Error(`User ${subscriber} is not subscribed to app ${app}`);
    }
    if (lastBill == null) {
        return {
            shouldBill: true,
            amount: pricing.minMonthlyCharge,
            isUpgrade: false,
        };
    }
    let currMonthlyCharge = new Decimal(pricing.minMonthlyCharge);
    let lastMonthlyCharge = new Decimal(lastBill.amount);
    let diff = currMonthlyCharge.sub(lastMonthlyCharge);
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
 */
export async function triggerBilling(
    context: RequestContext,
    { user, app }: { user: string; app: string }
): Promise<{ usageSummary: UsageSummary } | null> {
    let usageSummary = await collectUsageLogs(context, { user, app });
    if (usageSummary == null) {
        return null;
    }
    // TODO: fix this: need to add subscription to UsageLog
    let pricing = await findUserSubscriptionPricing(context, { user, app });
    if (!pricing) {
        console.error(
            chalk.red("No pricing found during triggerBilling"),
            user,
            app
        );
        throw new Error(
            `No pricing found during triggerBilling: ${user}, ${app}`
        );
    }
    let appItem = await context.batched.App.get(AppPK.parse(app));
    await generateAccountActivities(context, {
        usageSummary,
        pricing,
        subscriber: user,
        appAuthor: appItem.owner,
    });
    await settleAccountActivities(context, user, {
        consistentReadAccountActivities: true,
    });
    await settleAccountActivities(context, appItem.owner, {
        consistentReadAccountActivities: true,
    });
    return {
        usageSummary,
    };
}
