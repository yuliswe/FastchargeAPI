import { EventBridgeEvent, EventBridgeHandler } from "aws-lambda";
import { Chalk } from "chalk";
import { createDefaultContextBatched } from "../RequestContext";
import { GQLAccountActivityIndex } from "../__generated__/resolvers-types";
import { SQSQueueUrl, sqsGQLClient } from "./sqsClient";
import { gql } from "@apollo/client";
import {
    GQLTriggerSettleAccountActivitiesForUsersQuery,
    GQLTriggerSettleAccountActivitiesForUsersQueryVariables,
} from "../__generated__/operation-types";

const chalk = new Chalk({ level: 3 });

/**
 * Settles all pending account activities that have settleAt set in the past.
 * For example, when user pays for a subscription, a pending account activity is
 * created so that we can hold the subscription fee for 30 days. This cronjob
 * will settle them as they reach the settleAt time.
 */
async function handle(event: EventBridgeEvent<string, {}>, context: never, callback: never) {
    let batched = createDefaultContextBatched();
    let activities = await batched.AccountActivity.many(
        { status: "pending", settleAt: { le: Date.now() } },
        { using: GQLAccountActivityIndex.IndexByStatusSettleAtOnlyPk }
    );

    let users = new Set(activities.map((a) => a.user));
    console.log(chalk.yellow(`Processing ${activities.length} activities from ${users.size} users.`));

    // Important Note: You must process the account activities in the Billing
    // queue, even though it is attempting to write to the AccountActivity
    // directly using the DB APi here.
    let sqsClient = sqsGQLClient({ queueUrl: SQSQueueUrl.BillingFifoQueue });

    for (let user of users) {
        try {
            await sqsClient.query<
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
                    email: user,
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
