import { RequestContext } from "../RequestContext";
import {
    AccountActivity,
    AccountHistory,
    disableDBLogging,
    enableDBLogging,
    withDBLogging,
} from "../dynamoose/models";
import { AccountHistoryPK } from "./AccountHistoryPK";
import { Decimal } from "decimal.js-light";

/**
 * Collect any account activities that are in the pending status, and have the
 * settleAt property in the past. Create a new account AccountHistory for the
 * collected activities.
 * @param context
 * @param accountUser
 */
export async function collectBillingHistory(
    context: RequestContext,
    accountUser: string
): Promise<{
    accountHistory: AccountHistory;
    previousAccountHistory: AccountHistory;
    affectedAccountActivities: AccountActivity[];
} | null> {
    let closingTime = Date.now();

    let activities = await context.batched.AccountActivity.many({
        user: accountUser,
        status: "pending",
        settleAt: { le: closingTime },
    });

    if (activities.length === 0) {
        return null;
    }

    let previous = await context.batched.AccountHistory.getOrNull(
        {
            user: accountUser,
        },
        {
            sort: "descending",
            limit: 1,
        }
    );

    let accountHistory = await context.batched.AccountHistory.create({
        user: accountUser,
        startingBalance: previous == null ? "0" : previous.closingBalance,
        closingBalance: "0",
        startingTime: previous == null ? 0 : previous.closingTime,
        closingTime,
        sequentialID: previous == null ? 0 : previous.sequentialID + 1,
    });

    let balance = new Decimal(accountHistory.startingBalance);

    let promises = [];
    for (let activity of activities) {
        activity.status = "settled";
        activity.accountHistory = AccountHistoryPK.stringify(accountHistory);
        if (activity.type === "credit") {
            balance = balance.sub(activity.amount);
        } else if (activity.type === "debit") {
            balance = balance.add(activity.amount);
        }
        promises.push(activity.save());
    }

    accountHistory.closingBalance = balance.toString();
    promises.push(accountHistory.save());

    let results = [];
    let errors = [];
    for (let result of await Promise.allSettled(promises)) {
        if (result.status === "rejected") {
            console.error("Error when creating AccountHistory:", result.reason);
            errors.push(result.reason);
        } else {
            results.push(result.value);
        }
    }
    if (errors.length > 0) {
        throw new Error("Error when creating AccountHistory.");
    }

    return {
        previousAccountHistory: previous,
        accountHistory,
        affectedAccountActivities: activities,
    };
}
