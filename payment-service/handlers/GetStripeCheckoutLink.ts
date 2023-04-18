import { Context as LambdaContext, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import {
    LambdaCallbackV2,
    LambdaEventV2,
    LambdaHandlerV2,
    getAuthorizerContext,
    getUserPKFromEvent,
} from "../utils/LambdaContext";
import { getStripeClient } from "../utils/stripe-client";
import { RequestContext, UserPK, createDefaultContextBatched, getUserBalance } from "graphql-service";
import { Decimal } from "decimal.js-light";
import { GQLUserIndex } from "__generated__/gql-operations";

const chalk = new Chalk({ level: 3 });
const batched = createDefaultContextBatched();

function createRequestContext(): RequestContext {
    return {
        isServiceRequest: true,
        batched,
        service: "payment",
        isSQSMessage: false,
    };
}

export async function handle(
    event: LambdaEventV2,
    { skipBalanceCheck }: { skipBalanceCheck: boolean } = {
        skipBalanceCheck: false,
    }
): Promise<APIGatewayProxyStructuredResultV2> {
    const { params, error } = parseParams(event);
    if (error) {
        return error;
    }
    const { amount, successUrl, cancelUrl } = params!;
    const topUpAmount = new Decimal(amount);
    if (!skipBalanceCheck && topUpAmount.lessThan(1)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "The amount must be at least $1.",
            }),
        };
    }
    const userPK = getUserPKFromEvent(event);
    // Check if the account balance is too high
    const user = await batched.User.get(UserPK.parse(userPK));
    const curentBalance = new Decimal(await getUserBalance(createRequestContext(), UserPK.stringify(user)));
    const newBalance = curentBalance.plus(amount);
    if (!skipBalanceCheck && newBalance.greaterThan(user.balanceLimit)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "This top up would exceed your balance limit.",
            }),
        };
    }

    const stripeClient = await getStripeClient();
    const existingCustomerId = await identifyExistingCustomerId(user.email);
    const session = await stripeClient.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Top up your FastchargeAPI account: ${user.email}`,
                    },
                    unit_amount: topUpAmount.mul(100).toInteger().toNumber(), // Stripe expects the amount in cents
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
        customer_email: existingCustomerId ? undefined : user.email,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_creation: existingCustomerId ? undefined : "always",
    });

    await batched.User.update(user, {
        stripeCustomerId: session.customer as string,
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
            location: session.url,
        }),
    };
}

type BodyInput = {
    amount: string;
    successUrl: string;
    cancelUrl: string;
};

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

    let amount = body.amount;
    if (!amount) {
        return {
            error: {
                statusCode: 400,
                body: JSON.stringify({
                    error: "amount is required",
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
            amount,
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
