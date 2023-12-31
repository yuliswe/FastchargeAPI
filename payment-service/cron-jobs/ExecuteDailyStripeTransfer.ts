import { createDefaultContextBatched } from "@/RequestContext";
import { StripeTransferStatus } from "@/__generated__/resolvers-types";
import { StripeTransfer, StripeTransferTableIndex } from "@/database/models/StripeTransfer";
import { PK } from "@/database/utils";
import { safelySettlePromisesInBatchesByIterator, settlePromisesInBatches } from "@/functions/promise";
import { UserPK } from "@/pks/UserPK";
import { EventBridgeEvent } from "aws-lambda";
import { Chalk } from "chalk";
import { Decimal } from "decimal.js-light";
import { getStripeClient } from "utils/stripe-client";

const chalk = new Chalk({ level: 3 });

export type EventDetail = {
  dryRun?: boolean;
};
export const detailType = "ExecuteDailyStripeTransferSettings";
export type DetailType = typeof detailType;

/**
 * Find all pending StripeTransfer that have transferAt set before 12am (or
 * 11:59pm of the previous day). Send a report to SNS to notify admin, and
 * transfer the money to the user's Stripe account. This cronjob is invoked
 * twice in a day: once at 12am and once at 8pm. At 12am, it dry runs the
 * transfer and sends a report to SNS. At 8pm, it runs again to actually
 * complete the transfer.
 * @returns
 */
async function handle(event: EventBridgeEvent<DetailType, EventDetail>) {
  const batched = createDefaultContextBatched();
  const { dryRun } = event.detail;

  const due = new Date();
  due.setHours(0, 0, 0, 0);

  const pendingTransfers = batched.StripeTransfer.manyGenerator(
    {
      status: StripeTransferStatus.PendingTransfer,
      transferAt: {
        le: due.getTime(),
      },
    },
    {
      using: StripeTransferTableIndex.StatusTransferAt,
    }
  );

  const userToTransferDetail = new Map<PK, { total: Decimal; transfers: StripeTransfer[] }>();
  for await (const transfer of pendingTransfers) {
    const { receiver } = transfer;
    const amount = new Decimal(transfer.receiveAmount);
    const userTotal = userToTransferDetail.get(receiver) ?? { total: new Decimal(0), transfers: [] };
    userTotal.total = userTotal.total.plus(amount);
    userTotal.transfers.push(transfer);
    userToTransferDetail.set(receiver, userTotal);
  }

  if (dryRun ?? true) {
    const logs = [chalk.yellow(`Total amount to be transferred:`)];
    for (const [receiver, detail] of userToTransferDetail.entries()) {
      const { transfers, total } = detail;
      logs.push(chalk.yellow(`${receiver} $${total.toFixed(2)} (${transfers.length} transfers)`));
    }
    console.log(logs.join("\n"));

    return {
      statusCode: 200,
      body: "OK",
    };
  }

  const results = safelySettlePromisesInBatchesByIterator(
    userToTransferDetail.entries(),
    async ([receiver, detail]) => {
      const { transfers, total } = detail;
      const user = await batched.User.get(UserPK.parse(receiver));
      const { stripeConnectAccountId } = user;
      if (!stripeConnectAccountId) {
        // User did not connect their Stripe account yet
        throw `User ${receiver} has no stripeConnectAccountId`;
      }
      // Save status right away to make sure we don't double transfer
      await settlePromisesInBatches(transfers, (transfer) =>
        batched.StripeTransfer.update(transfer, {
          status: StripeTransferStatus.Transferred,
        })
      );
      try {
        const stripeClient = await getStripeClient();
        await stripeClient.transfers.create({
          amount: new Decimal(total).mul(100).toInteger().toNumber(),
          currency: "usd",
          destination: stripeConnectAccountId,
        });
      } catch (error) {
        // revert status
        await settlePromisesInBatches(transfers, (transfer) =>
          batched.StripeTransfer.update(transfer, {
            status: StripeTransferStatus.PendingTransfer,
          })
        );
        throw error;
      }
    }
  );

  for await (const result of results) {
    if (result.status === "rejected") {
      console.error(chalk.red(JSON.stringify(result.reason, null, 2)));
    }
  }
  return {
    statusCode: 200,
    body: "OK",
  };
}

export const lambdaHandler = async (event: EventBridgeEvent<DetailType, EventDetail>) => {
  try {
    console.log(chalk.blue(JSON.stringify(event, null, 2)));
    return await handle(event);
  } catch (error) {
    console.error(chalk.red(JSON.stringify(error, null, 2)));
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
