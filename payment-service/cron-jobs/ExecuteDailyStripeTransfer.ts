import { EventBridgeEvent, EventBridgeHandler } from "aws-lambda";
import { StripeTransferPK, UserPK, createDefaultContextBatched } from "graphql-service";
import { Chalk } from "chalk";
import { GQLStripeTransferIndex } from "../__generated__/gql-operations";
import { Decimal } from "decimal.js-light";
import { getStripeClient } from "../utils/stripe-client";
const chalk = new Chalk({ level: 3 });

type EventDetail = {
    dryRun?: boolean;
};

/**
 * Find all pending StripeTransfer that have transferAt set before 12am (or
 * 11:59pm of the previous day). Send a report to SNS to notify admin, and
 * transfer the money to the user's Stripe account. This cronjob is invoked
 * twice in a day: once at 12am and once at 8pm. At 12am, it dry runs the
 * transfer and sends a report to SNS. At 8pm, it runs again to actually
 * complete the transfer.
 * @returns
 */
async function handle(event: EventBridgeEvent<string, EventDetail>, context: never, callback: never) {
    let batched = createDefaultContextBatched();
    let isDryRun = true;
    let detail = event.detail;
    if (typeof detail === "string") {
        detail = JSON.parse(detail);
    }
    isDryRun = detail?.dryRun ?? true;
    let due = new Date();
    due.setHours(0, 0, 0, 0);
    let pendingTransfers = await batched.StripeTransfer.many(
        {
            status: "pending",
            transferAt: { lt: due.getTime() },
        },
        {
            using: GQLStripeTransferIndex.IndexByStatusTransferAtOnlyPk,
        }
    );
    console.log(chalk.yellow(`Found ${pendingTransfers.length} pending transfers`));
    let total = new Decimal(0);
    let failureCount = 0;
    let chunkSize = 10;
    for (let i = 0; i < pendingTransfers.length; i += chunkSize) {
        let chunk = pendingTransfers.slice(i, Math.min(pendingTransfers.length, i + chunkSize));

        let promises = chunk.map(async (transfer) => {
            let receiver = await batched.User.get(UserPK.parse(transfer.receiver));
            if (!receiver.stripeConnectAccountId) {
                // User did not connect their Stripe account yet
                return;
            }
            if (isDryRun) {
                console.log(chalk.yellow(`Dry run transfer to ${receiver.email} $${transfer.receiveAmount}`));
                total = total.plus(transfer.receiveAmount);
            } else {
                console.log(chalk.yellow(`Transfer to ${receiver.email} $${transfer.receiveAmount}`));

                // Save status right away to make sure we don't double transfer
                await batched.StripeTransfer.update(transfer, {
                    status: "transferred",
                });
                try {
                    let stripeClient = await getStripeClient();
                    await stripeClient.transfers.create({
                        amount: new Decimal(transfer.receiveAmount).mul(100).toInteger().toNumber(),
                        currency: "usd",
                        destination: receiver.stripeConnectAccountId,
                        transfer_group: StripeTransferPK.stringify(transfer),
                    });
                    total = total.plus(transfer.receiveAmount);
                } catch (error) {
                    await batched.StripeTransfer.update(transfer, {
                        status: "failed",
                    });
                    failureCount++;
                    try {
                        console.error(chalk.red(JSON.stringify(error)));
                    } catch {
                        // ignore json error
                    }
                }
            }
        });

        await Promise.allSettled(promises);
    }

    if (isDryRun) {
        console.log(chalk.yellow(`Total amount to be transferred: $${total.toString()}`));
    } else {
        console.log(chalk.yellow(`Total amount transferred: $${total.toString()}`));
        if (failureCount > 0) {
            console.log(chalk.red(`Failed to transfer ${failureCount} transfers. Please check the logs.`));
        }
    }

    return {
        statusCode: 200,
        body: "OK",
    };
}

export const lambdaHandler: EventBridgeHandler<string, {}, {}> = async (
    event: EventBridgeEvent<string, EventDetail>,
    context: never,
    callback: never
) => {
    try {
        console.log(chalk.blue(JSON.stringify(event)));
        return await handle(event, context, callback);
    } catch (error) {
        try {
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            // ignore
        }
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};
