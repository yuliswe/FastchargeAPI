import { gql } from "@apollo/client/core";
import { Chalk } from "chalk";
import Decimal from "decimal.js-light";
import { Item } from "dynamoose/dist/Item";
import { RequestContext } from "../RequestContext";
import {
    GQLTriggerSettleAccountActivitiesForUsersQuery,
    GQLTriggerSettleAccountActivitiesForUsersQueryVariables,
} from "../__generated__/operation-types";
import { AccountActivity, AccountHistory } from "../dynamoose/models";
import { AlreadyExists } from "../errors";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { AccountHistoryPK } from "../pks/AccountHistoryPK";
import { SQSQueueUrl, sqsGQLClient } from "../sqsClient";

const chalk = new Chalk({ level: 3 });

export function enforceCalledFromQueue(context: RequestContext, accountUser: string) {
    if (!context.isSQSMessage) {
        if (!process.env.UNSAFE_BILLING) {
            console.error(
                chalk.red(
                    `This function must be called from an SQS message. If you are not running in production, you can set the UNSAFE_BILLING=1 environment variable to bypass this check.`
                )
            );
            throw new Error("This function must be called from SQS");
        }
    }
    if (!context.isSQSMessage && context.sqsQueueName !== accountUser) {
        if (!process.env.UNSAFE_BILLING) {
            console.error(
                chalk.red(
                    `SQS group ID must be the receiver. Expected: ${accountUser}, current: ${
                        context.sqsQueueName ?? "undefined"
                    }. If you are not running in production, you can set the UNSAFE_BILLING=1 environment variable to bypass this check.`
                )
            );
            throw new Error("SQS group ID must be the receiver.");
        }
    }
}

export async function settleAccountActivitiesOnSQS(context: RequestContext, accountUser: string) {
    if (context.isSQSMessage) {
        throw new Error("settleAccountActivitiesOnSQS must not be called from SQS. It may cause an infinite loop.");
    }
    const client = sqsGQLClient({ queueUrl: SQSQueueUrl.BillingQueue, dedupId: accountUser, groupId: accountUser });
    await client.query<
        GQLTriggerSettleAccountActivitiesForUsersQuery,
        GQLTriggerSettleAccountActivitiesForUsersQueryVariables
    >({
        query: gql`
            query TriggerSettleAccountActivitiesForUsers($email: Email!) {
                user(email: $email) {
                    settleAccountActivities {
                        pk
                    }
                }
            }
        `,
        variables: {
            email: accountUser,
        },
    });
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
            status: "pending",
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

    let accountHistory: AccountHistory | undefined = undefined;
    try {
        accountHistory = await context.batched.AccountHistory.create({
            user: accountUser,
            startingBalance: previous == null ? "0" : previous.closingBalance,
            closingBalance: previous == null ? "0" : previous.closingBalance,
            startingTime: previous == null ? 0 : previous.closingTime,
            closingTime,
            sequentialId: previous == null ? 0 : previous.sequentialId + 1,
        });
    } catch (e) {
        if (e instanceof AlreadyExists) {
            if (process.env.UNSAFE_BILLING == "1") {
                return null;
            }
            throw new Error(
                chalk.red(
                    "AccountHistory already exists. If you are running in production, this is a bug. " +
                        "settleAccountActivities() might be called from multiple workers, while it is not multi-workers safe. " +
                        "If you are running in development, this is likely to be ok. " +
                        "You can set the UNSAFE_BILLING=1 environment variable to bypass this check."
                )
            );
        }
        throw e;
    }

    let balance = new Decimal(accountHistory.startingBalance);

    const promises: Promise<Item>[] = [];
    for (const activity of activities) {
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

    const results: Item[] = [];
    const errors: string[] = [];
    for (const result of await Promise.allSettled(promises)) {
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

export function getAccountActivityByPK(context: RequestContext, pk: string): Promise<AccountActivity> {
    return context.batched.AccountActivity.get(AccountActivityPK.parse(pk));
}
