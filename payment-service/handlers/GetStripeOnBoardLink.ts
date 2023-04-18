import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import { UserPK, createDefaultContextBatched } from "graphql-service";
import { LambdaEventV2, LambdaHandlerV2, getUserPKFromEvent } from "../utils/LambdaContext";
import { getStripeClient } from "../utils/stripe-client";

const chalk = new Chalk({ level: 3 });
const batched = createDefaultContextBatched();

async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    const stripeClient = await getStripeClient();

    const userPK = getUserPKFromEvent(event);

    const returnUrl = event.queryStringParameters?.return_url;
    if (!returnUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "return_url is required",
            }),
        };
    }
    const refreshUrl = event.queryStringParameters?.refresh_url;
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
    const user = await batched.User.get(UserPK.parse(userPK));
    let accountId = user.stripeConnectAccountId;
    if (!accountId) {
        const result = await stripeClient.accounts.create({
            type: "express",
            email: user.email,
            metadata: {
                userPK: UserPK.stringify(user),
                email: user.email,
            },
        });
        accountId = result.id;
        await batched.User.update(user, { stripeConnectAccountId: accountId });
    }
    const link = await stripeClient.accountLinks.create({
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
