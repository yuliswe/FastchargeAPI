import { Context as LambdaContext, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import { LambdaCallbackV2, LambdaEventV2, LambdaHandlerV2, getAuthorizerContext } from "../utils/LambdaContext";
import { getStripeClient } from "../utils/stripe-client";
import { createDefaultContextBatched } from "graphql-service";

const chalk = new Chalk({ level: 3 });
const batched = createDefaultContextBatched();

export async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    let { params, error } = parseParams(event);
    if (error) {
        return error;
    }
    let { amountCents, successUrl, cancelUrl } = params!;
    let userEmail = getAuthorizerContext(event).userEmail;
    if (!userEmail) {
        throw new Error("User email is not set");
    }
    let stripeClient = await getStripeClient();
    let existingCustomerId = await identifyExistingCustomerId(userEmail);
    let session = await stripeClient.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Top up your FastchargeAPI account: ${userEmail}`,
                    },
                    unit_amount: Number.parseInt(amountCents),
                    tax_behavior: "exclusive",
                },
                quantity: 1,
            },
        ],
        automatic_tax: {
            enabled: true,
        },
        currency: "usd",
        customer: existingCustomerId,
        customer_email: existingCustomerId ? undefined : userEmail,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_creation: existingCustomerId ? undefined : "always",
    });

    await batched.User.update(
        { email: userEmail },
        {
            stripeCustomerId: session.customer as string,
        }
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            location: session.url,
        }),
    };
}

type BodyInput = {
    amountCents: string;
    successUrl: string;
    cancelUrl: string;
};

export const lambdaHandler: LambdaHandlerV2 = async (
    event: LambdaEventV2,
    context: LambdaContext,
    callbac: LambdaCallbackV2
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

function parseParams(event: LambdaEventV2): { params?: BodyInput; error?: APIGatewayProxyStructuredResultV2 } {
    let bodyStr = event.body;
    if (!bodyStr) {
        return {
            error: {
                statusCode: 400,
                body: JSON.stringify({
                    error: "body is required",
                }),
            },
        };
    }
    let body: BodyInput;
    try {
        body = JSON.parse(bodyStr);
    } catch (error) {
        return {
            error: {
                statusCode: 400,
                body: JSON.stringify({
                    error: "body is not a valid JSON",
                }),
            },
        };
    }

    let amountCents = body.amountCents;
    if (!amountCents) {
        return {
            error: {
                statusCode: 400,
                body: JSON.stringify({
                    error: "amountCents is required",
                }),
            },
        };
    }

    let successUrl = body.successUrl;
    if (!successUrl) {
        return {
            error: {
                statusCode: 400,
                body: JSON.stringify({
                    error: "successUrl is required",
                }),
            },
        };
    }

    let cancelUrl = body.cancelUrl;
    if (!cancelUrl) {
        return {
            error: {
                statusCode: 400,
                body: JSON.stringify({
                    error: "cancelUrl is required",
                }),
            },
        };
    }

    return {
        params: {
            amountCents,
            successUrl,
            cancelUrl,
        },
    };
}

async function identifyExistingCustomerId(userEmail: string): Promise<string | undefined> {
    let stripeClient = await getStripeClient();
    let customers = await stripeClient.customers.list({
        email: userEmail,
    });
    if (customers.data.length > 0) {
        return customers.data[0].id;
    } else {
        return undefined;
    }
}
