import { RequestContext } from "@/src/RequestContext";
import Decimal from "decimal.js-light";

import { graphql } from "@/src/__generated__/gql";
import { AccountActivityStatus, AccountActivityType } from "@/src/__generated__/resolvers-types";
import { AccountActivity } from "@/src/database/models/AccountActivity";
import { AccountHistory } from "@/src/database/models/AccountHistory";
import { enforceCalledFromSQS } from "@/src/functions/aws";
import { settlePromisesInBatches } from "@/src/functions/promise";
import { AccountHistoryPK } from "@/src/pks/AccountHistoryPK";
import { getSQSClient, SQSQueueName } from "@/src/sqsClient";

export async function settleAccountActivitiesOnSQS(accountUser: string) {
  const result = await getSQSClient({
    queueName: SQSQueueName.BillingQueue,
    dedupId: "SettleAccountActivitiesOnSQS-" + accountUser,
    groupId: accountUser,
  }).mutate({
    mutation: graphql(`
      mutation SettleAccountActivitiesOnSQS($user: ID!) {
        _sqsSettleAccountActivitiesForUser(user: $user)
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
export async function sqsSettleAccountActivities(
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
  enforceCalledFromSQS(context, {
    groupId: accountUser,
    queueName: SQSQueueName.BillingQueue,
  });
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

  let accountHistory = await context.batched.AccountHistory.create({
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
        if (activity.type === AccountActivityType.Outgoing) {
          balance = balance.sub(activity.amount);
        } else {
          balance = balance.add(activity.amount);
        }
        return activity;
      }),
    { batchSize: 10 }
  );

  accountHistory = await context.batched.AccountHistory.update(accountHistory, {
    closingBalance: balance.toString(),
  });

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