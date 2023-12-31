import { EventBridgeEvent } from "aws-lambda";
import chalk from "chalk";

import { AccountActivityStatus } from "@/__generated__/resolvers-types";
import { AccountActivityTableIndex } from "@/database/models/AccountActivity";
import { settleAccountActivitiesOnSQS } from "@/functions/account";
import { safelySettlePromisesInBatches } from "@/functions/promise";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";

type EventDetail = {};
export const detailType = "SettlePendingAccountActivitiesPastDueSettings";
export type DetailType = typeof detailType;

/**
 * Settles all pending account activities that have settleAt set in the past.
 * For example, when user pays for a subscription, a pending account activity is
 * created so that we can hold the subscription fee for 30 days. This cronjob
 * will settle them as they reach the settleAt time.
 */
async function handle(event: EventBridgeEvent<DetailType, EventDetail>) {
  const users = new Set<string>();
  const accountActivities = context.batched.AccountActivity.manyGenerator(
    { status: AccountActivityStatus.Pending, settleAt: { le: Date.now() } },
    { using: AccountActivityTableIndex.StatusSettleAt, limit: 1000 }
  );

  let total = 0;
  for await (const activity of accountActivities) {
    total++;
    users.add(activity.user);
  }

  console.log(chalk.yellow(`Processing ${total} activities from ${users.size} users.`));

  await safelySettlePromisesInBatches([...users], settleAccountActivitiesOnSQS, { batchSize: 10 });

  return {
    statusCode: 200,
    body: "OK",
  };
}

export const lambdaHandler = async (event: EventBridgeEvent<DetailType, EventDetail>) => {
  try {
    return await handle(event);
  } catch (error) {
    console.error(chalk.red(JSON.stringify(error, null, 2)));
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
