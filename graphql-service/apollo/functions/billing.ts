import { AccountActivity, Pricing, UsageSummary } from "../dynamoose/models";
import { UsageSummaryPK } from "./UsageSummaryPK";
import { RequestContext } from "../RequestContext";
import Decimal from "decimal.js-light";

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
export async function collectAccountActivities(
    context: RequestContext,
    usageSummary: UsageSummary,
    pricing: Pricing,
    subscriber: string,
    appAuthor: string,
    {
        monthlyChargeOnHoldPeriodInSeconds = 60 * 60 * 24 * 30, // default to 30 days
        disableMonthlyCharge = false,
    } = {}
) {
    let volume = usageSummary.volume;
    let price = new Decimal(pricing.chargePerRequest);
    let amount = price.mul(volume);
    usageSummary.status = "billed";
    usageSummary.billedAt = Date.now();
    let results = {
        subscriberPerRequest: context.batched.AccountActivity.create({
            user: subscriber,
            type: "credit",
            reason: "api_per_request_charge",
            status: "pending",
            settleAt: Date.now(),
            amount: amount.toString(),
            usageSummary: UsageSummaryPK.stringify(usageSummary),
        }),
        appAuthorPerRequest: context.batched.AccountActivity.create({
            user: appAuthor,
            type: "debit",
            reason: "api_per_request_charge",
            status: "pending",
            settleAt: Date.now(),
            amount: amount.toString(),
            usageSummary: UsageSummaryPK.stringify(usageSummary),
        }),
        newUsageSummary: usageSummary.save(),
        subscriberMinMonthly: null,
        appAuthorMinMonthly: null,
    };
    if (
        !disableMonthlyCharge &&
        (await shouldCollectMonthlyCharge(context, subscriber))
    ) {
        results.appAuthorMinMonthly = context.batched.AccountActivity.create({
            user: subscriber,
            type: "credit",
            reason: "api_min_monthly_charge",
            status: "pending",
            settleAt: Date.now(), // We want to charge the subscriber immediately
            amount: amount.toString(),
            usageSummary: UsageSummaryPK.stringify(usageSummary),
        });
        results.subscriberMinMonthly = context.batched.AccountActivity.create({
            user: appAuthor,
            type: "debit",
            reason: "api_min_monthly_charge",
            status: "pending",
            settleAt: Date.now() + 1000 * monthlyChargeOnHoldPeriodInSeconds,
            amount: amount.toString(),
            usageSummary: UsageSummaryPK.stringify(usageSummary),
        });
    }
    let errors = [];
    for (let result of await Promise.allSettled(Object.values(results))) {
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
 * Monthly charge happens when the previous usage summary is older than 30 days
 * and it has not been billed.
 */
async function shouldCollectMonthlyCharge(
    context: RequestContext,
    subscriber: string,
    collectionPeriodInSeconds: number = 60 * 60 * 24 * 30 // default to 30 days
): Promise<boolean> {
    let lastUsageSummary = await context.batched.UsageSummary.getOrNull(
        {
            subscriber,
            createdAt: { lt: Date.now() - 1000 * collectionPeriodInSeconds },
        },
        {
            sort: "descending",
            limit: 1,
        }
    );
    if (lastUsageSummary == null) {
        return true;
    }
    return lastUsageSummary.status === "pending";
}
