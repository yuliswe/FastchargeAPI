import { EventBridgeEvent, EventBridgeHandler } from "aws-lambda";
import { Chalk } from "chalk";
import { createDefaultContextBatched } from "../RequestContext";

import { AccountActivityTableIndex } from "@/database/models/AccountActivity";
import { graphql } from "@/typed-graphql";
import { AccountActivityStatus } from "../__generated__/resolvers-types";
import { SQSQueueName, sqsGQLClient } from "../sqsClient";

const chalk = new Chalk({ level: 3 });

/**
 * Settles all pending account activities that have settleAt set in the past.
 * For example, when user pays for a subscription, a pending account activity is
 * created so that we can hold the subscription fee for 30 days. This cronjob
 * will settle them as they reach the settleAt time.
 */
async function handle(event: EventBridgeEvent<string, {}>, context: never, callback: never) {
    const batched = createDefaultContextBatched();
    const activities = await batched.AccountActivity.many(
        { status: AccountActivityStatus.Pending, settleAt: { le: Date.now() } },
        { using: AccountActivityTableIndex.StatusSettleAt }
    );

    const users = new Set(activities.map((a) => a.user));
    console.log(chalk.yellow(`Processing ${activities.length} activities from ${users.size} users.`));

    // Important Note: You must process the account activities in the Billing
    // queue, even though it is attempting to write to the AccountActivity
    // directly using the DB APi here.
    const sqsClient = sqsGQLClient({ queueName: SQSQueueName.BillingQueue });

    for (const user of users) {
        try {
            await sqsClient.mutate({
                mutation: graphql(`
                    mutation TriggerSettleAccountActivitiesForUsers($user: ID!) {
                        _sqsSettleAccountActivitiesForUser(user: $user)
                    }
                `),
                variables: {
                    user,
                },
            });
        } catch (error) {
            try {
                console.error(chalk.red(JSON.stringify(error)));
            } catch {
                // ignore json error
            }
        }
    }

    return {
        statusCode: 200,
        body: "OK",
    };
}

export const lambdaHandler: EventBridgeHandler<string, {}, {}> = async (
    event: EventBridgeEvent<string, {}>,
    context: never,
    callback: never
) => {
    try {
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
