import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import { LambdaEventV2, LambdaHandlerV2, getAuthorizerContext } from "../utils/LambdaContext";
import { createDefaultContextBatched } from "graphql-service";
import { getStripeClient } from "../utils/stripe-client";

const chalk = new Chalk({ level: 3 });
const batched = createDefaultContextBatched();

async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    const stripeClient = await getStripeClient();

    let userEmail = getAuthorizerContext(event).userEmail;
    if (!userEmail) {
        throw new Error("User email is not set");
    }
    let returnUrl = event.queryStringParameters?.return_url;
    if (!returnUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "return_url is required",
            }),
        };
    }
    let refreshUrl = event.queryStringParameters?.refresh_url;
    if (!refreshUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "c is required",
            }),
        };
    }
    // It may happen that the user has already onboarded and has a Stripe
    // account, but is revisiting the page becuase they didn't complete the
    // onboarding the previous time.
    let user = await batched.User.get({ email: userEmail });
    let accountId = user.stripeConnectAccountId;
    if (!accountId) {
        let result = await stripeClient.accounts.create({
            type: "express",
            email: userEmail,
        });
        accountId = result.id;
        await batched.User.update({ email: userEmail }, { stripeConnectAccountId: accountId });
    }
    let link = await stripeClient.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
            location: link.url,
        }),
    };
}

export const lambdaHandler: LambdaHandlerV2 = async (
    event,
    context,
    callback
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
