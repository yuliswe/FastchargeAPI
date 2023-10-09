import Decimal from "decimal.js-light";
import { RequestContext } from "../RequestContext";

import { AccountActivity } from "@/database/models/AccountActivity";
import { AccountHistory } from "@/database/models/AccountHistory";
import { graphql } from "../__generated__/gql";
import { AccountActivityStatus, AccountActivityType } from "../__generated__/resolvers-types";
import { AccountHistoryPK } from "../pks/AccountHistoryPK";
import { SQSQueueName, sqsGQLClient } from "../sqsClient";
import { enforceCalledFromQueue } from "./aws";
import { settlePromisesInBatches } from "./promise";

export async function settleAccountActivitiesOnSQS(context: RequestContext, accountUser: string) {
    const client = sqsGQLClient({ queueName: SQSQueueName.BillingQueue, dedupId: accountUser, groupId: accountUser });
    const result = await client.query({
        query: graphql(`
            query SettleAccountActivitiesOnSQS($user: ID!) {
                getUser(pk: $user) {
                    settleAccountActivities {
                        pk
                    }
                }
            }
        `),
        variables: {
            user: accountUser,
        },
    });
    return result;
}

/**
 * Collect any account activities that are in the pending status, and have the
 * settleAt property in the past. Create a new account AccountHistory for the
 * collected activities.
 * @param context
 * @param accountUser
 * @param options.consistentReadAccountActivities If true, the AccountActivity
 * are read consistently, ie, wait for all prior writes to finish before
 * reading. This is more expensive, and isn't always necessary. For example, if
 * you are processing billing for usage logs, you don't need to wait for all
 * usage logs to be written (if we miss some we'll collect them later). Sometime
 * it is important to wait for all writes, for example, when testing.
 * @idempotent Yes
 * @workerSafe No - When called from multiple processes, it can cause the same
 * AccountActivity to be processed multiple times.
 */
export async function settleAccountActivities(
    context: RequestContext,
    accountUser: string,
    options?: {
        consistentReadAccountActivities: boolean;
    }
): Promise<{
    newAccountHistory: AccountHistory;
    previousAccountHistory: AccountHistory | null;
    affectedAccountActivities: AccountActivity[];
} | null> {
    enforceCalledFromQueue(context, accountUser);
    const closingTime = Date.now();
    const activities = await context.batched.AccountActivity.many(
        {
            user: accountUser,
            status: AccountActivityStatus.Pending,
            settleAt: { le: closingTime },
        },
        {
            consistent: options?.consistentReadAccountActivities,
        }
    );
    if (activities.length === 0) {
        return null;
    }
    const previous = await context.batched.AccountHistory.getOrNull(
        {
            user: accountUser,
        },
        {
            sort: "descending",
            limit: 1,
            consistent: true, // Must use consistently, otherwise we might not get a correct startingTime, or sequentialID
        }
    );

    const accountHistory = await context.batched.AccountHistory.create({
        user: accountUser,
        startingBalance: previous == null ? "0" : previous.closingBalance,
        closingBalance: previous == null ? "0" : previous.closingBalance,
        startingTime: previous == null ? 0 : previous.closingTime,
        closingTime,
        sequentialId: previous == null ? 0 : previous.sequentialId + 1,
    });

    let balance = new Decimal(accountHistory.startingBalance);

    await settlePromisesInBatches(
        activities,
        (activity) =>
            context.batched.AccountActivity.update(activity, {
                status: AccountActivityStatus.Settled,
                accountHistory: AccountHistoryPK.stringify(accountHistory),
            }).then((activity) => {
                // Only update the balance when successfully settled.
                if (activity.type === AccountActivityType.Credit) {
                    balance = balance.sub(activity.amount);
                } else if (activity.type === AccountActivityType.Debit) {
                    balance = balance.add(activity.amount);
                }
                return activity;
            }),
        { batchSize: 10 }
    );

    await context.batched.AccountHistory.update(accountHistory, { closingBalance: balance.toString() });

    return {
        previousAccountHistory: previous,
        newAccountHistory: accountHistory,
        affectedAccountActivities: activities,
    };
}

/**
 * The balance is the closing balance of the most recent account history.
 * @param userPK
 */
export async function getUserBalance(
    context: RequestContext,
    userPK: string,
    { consistent }: { consistent?: boolean } = {}
): Promise<string> {
    const accountHistory = await getUserAccountHistoryRepresentingBalance(context, userPK, { consistent });
    if (accountHistory) {
        return accountHistory.closingBalance;
    } else {
        return "0";
    }
}

/**
 * Returns the most recent account history for the user.
 */
export async function getUserAccountHistoryRepresentingBalance(
    context: RequestContext,
    userPK: string,
    { consistent }: { consistent?: boolean } = {}
): Promise<AccountHistory | null> {
    return context.batched.AccountHistory.getOrNull({ user: userPK }, { sort: "descending", limit: 1, consistent });
}
