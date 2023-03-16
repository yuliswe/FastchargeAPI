import { Item } from "dynamoose/dist/Item";
import { RequestContext } from "../RequestContext";
import { AccountActivity, AccountHistory } from "../dynamoose/models";
import { AccountHistoryPK } from "../pks/AccountHistoryPK";
import Decimal from "decimal.js-light";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { Chalk } from "chalk";
import { AlreadyExists } from "../errors";

const chalk = new Chalk({ level: 3 });

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
    if (!context.isSQSMessage) {
        if (!process.env.UNSAFE_BILLING) {
            console.error(
                chalk.red(
                    `settleAccountActivities() must be called from an SQS message. If you are not running in production, you can set the UNSAFE_BILLING=1 environment variable to bypass this check.`
                )
            );
            throw new Error("settleAccountActivities() must be called from SQS");
        }
    }

    let closingTime = Date.now();
    let activities = await context.batched.AccountActivity.many(
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

    let previous = await context.batched.AccountHistory.getOrNull(
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
            sequentialID: previous == null ? 0 : previous.sequentialID + 1,
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

    let promises: Promise<Item>[] = [];
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

    let results: Item[] = [];
    let errors: string[] = [];
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
    {
        refresh,
        consistent,
    }: {
        refresh?: boolean;
        consistent?: boolean;
    } = {}
): Promise<string> {
    if (refresh) {
        context.batched.AccountActivity.clearCache();
    }
    let accountHistory = await context.batched.AccountHistory.getOrNull(
        {
            user: userPK,
        },
        {
            sort: "descending",
            limit: 1,
            consistent,
        }
    );
    if (accountHistory) {
        return accountHistory.closingBalance;
    } else {
        return "0";
    }
}

export function getAccountActivityByPK(context: RequestContext, pk: string): Promise<AccountActivity> {
    return context.batched.AccountActivity.get(AccountActivityPK.parse(pk));
}
