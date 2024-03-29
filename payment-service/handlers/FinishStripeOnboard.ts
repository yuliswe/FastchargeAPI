/**
 * You can use this file as a template for your Lambda function.
 */

import { Context as LambdaContext, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import { LambdaCallbackV2, LambdaEventV2, LambdaHandlerV2 } from "../utils/LambdaContext";
import { parseStripeWebhookEvent } from "../utils/stripe-client";
import Stripe from "stripe";
import { createDefaultContextBatched } from "graphql-service";
import { GQLUserIndex } from "__generated__/gql-operations";

const chalk = new Chalk({ level: 3 });
const batched = createDefaultContextBatched();

async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    const stripeEvent = await parseStripeWebhookEvent(event);
    console.log("stripeEvent", chalk.blue(JSON.stringify(stripeEvent)));

    switch (stripeEvent.type) {
        case "account.updated": {
            const accountUpdatedObject = stripeEvent.data.object as Stripe.Account;
            const userEmail = accountUpdatedObject.email;
            if (!userEmail) {
                throw new Error("No email on stripeEvent.data.object.email");
            }

            const user = await batched.User.get({ email: userEmail }, { using: GQLUserIndex.IndexByEmailOnlyPk });
            await batched.User.update(user, {
                stripeConnectAccountId: accountUpdatedObject.id,
            });

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "stripeConnectAccountId updated",
                }),
            };
        }
    }

    return {
        statusCode: 400,
        body: JSON.stringify({
            message: "This webhook event is not supported",
        }),
    };
}

export const lambdaHandler: LambdaHandlerV2 = async (
    event: LambdaEventV2,
    context: LambdaContext,
    callback: LambdaCallbackV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
        console.log("event", chalk.blue(JSON.stringify(event)));
        return await handle(event);
    } catch (error) {
        try {
            console.error(error);
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            console.error(error);
        }
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};
