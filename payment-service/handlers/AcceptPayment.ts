import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import { LambdaEventV2, LambdaHandlerV2 } from "../utils/LambdaContext";
import { createDefaultContextBatched, sqsGQLClient } from "graphql-service";
import { parseStripeWebhookEvent } from "../utils/stripe-client";
import { StripePaymentAccept } from "graphql-service/dynamoose/models";
import { SQSQueueUrl } from "graphql-service/cron-jobs/sqsClient";
import { gql } from "@apollo/client";
import Decimal from "decimal.js-light";
import {
    GQLFulfillUserStripePaymentAcceptQuery,
    GQLFulfillUserStripePaymentAcceptQueryVariables,
} from "../__generated__/gql-operations";
import { Stripe } from "stripe";

const chalk = new Chalk({ level: 3 });
const batched = createDefaultContextBatched();

type StripeSessionObject = {
    id: string;
    object: "checkout.session";
    payment_status: "paid" | "unpaid";
    customer_details: { email: string };
    payment_intent: string;
    customer: string; // Stripe customer ID
    amount_total: number; // In cents
};

export async function handle(
    event: LambdaEventV2,
    {
        stripeParser,
    }: {
        stripeParser: (event: LambdaEventV2) => Promise<Stripe.Event>; // Allows mocking in tests
    } = {
        stripeParser: parseStripeWebhookEvent,
    }
): Promise<APIGatewayProxyStructuredResultV2> {
    let stripeEvent = await stripeParser(event);

    console.log(chalk.yellow("Stripe event: " + JSON.stringify(stripeEvent)));

    switch (stripeEvent.type) {
        case "checkout.session.completed": {
            let session = stripeEvent.data.object as StripeSessionObject;
            let amount = new Decimal(session.amount_total).div(100).toString();
            let email = session.customer_details.email;
            if (!email) {
                throw new Error("Email not found in Stripe session.");
            }
            // Check if the order is already paid (for example, from a card
            // payment)
            //
            // A delayed notification payment will have an `unpaid` status, as
            // you're still waiting for funds to be transferred from the
            // customer's account.
            if (session.payment_status === "paid") {
                // Save an order in your database, marked as 'awaiting payment'
                await createAndFufillOrder({ session, email, amount });
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: "Order created and fulfilled.",
                    }),
                };
            } else {
                await createOrder({ session, email, amount });
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: "Order created, awaiting payment.",
                    }),
                };
            }
        }
        case "checkout.session.async_payment_succeeded": {
            let session = stripeEvent.data.object as StripeSessionObject;
            let email = session.customer_details.email;
            let paymentAccept = await batched.StripePaymentAccept.get({
                user: email,
            });
            await fulfillOrder(paymentAccept, session);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Order fulfilled asynchronously.",
                }),
            };
        }
        case "checkout.session.async_payment_failed": {
            let session = stripeEvent.data.object as StripeSessionObject;
            await emailCustomerAboutFailedPayment(session);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Customer notified of failed payment.",
                }),
            };
        }
    }

    return {
        statusCode: 400,
        body: `Event type not handled by this webhook: ${stripeEvent.type}`,
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

async function createAndFufillOrder({
    session,
    email,
    amount,
}: {
    session: StripeSessionObject;
    email: string;
    amount: string;
}): Promise<StripePaymentAccept> {
    let paymentAccept = await createOrder({ session, email, amount });
    await fulfillOrder(paymentAccept, session);
    return paymentAccept;
}

async function createOrder({
    session,
    email,
    amount,
}: {
    session: StripeSessionObject;
    email: string;
    amount: string;
}): Promise<StripePaymentAccept> {
    // console.log(chalk.yellow("Creating order"), email, amount, session);
    return batched.StripePaymentAccept.create({
        user: email,
        amount,
        currency: "usd",
        stripePaymentStatus: session.payment_status as StripePaymentAccept["stripePaymentStatus"],
        stripeSessionId: session.id,
        stripePaymentIntent: session.payment_intent,
        stripeSessionObject: session,
    });
}

/**
 * Requires SQS access to the BillingFifoQueue.
 */
async function fulfillOrder(paymentAccept: StripePaymentAccept, session: StripeSessionObject): Promise<void> {
    // console.log(chalk.yellow("Fulfilling order"), paymentAccept, session);
    // Settling the payment must be done on the billing queue
    let billingQueueClient = sqsGQLClient({
        queueUrl: SQSQueueUrl.BillingFifoQueue,
        dedupId: `${paymentAccept.user}-fulfillOrder-${session.id}`,
    });
    await billingQueueClient.query<
        GQLFulfillUserStripePaymentAcceptQuery,
        GQLFulfillUserStripePaymentAcceptQueryVariables
    >({
        query: gql(`
            query FulfillUserStripePaymentAccept($user: Email!, $stripeSessionId: String!, $stripeSessionObject: String!) {
                user(email: $user) {
                    stripePaymentAccept(stripeSessionId: $stripeSessionId) {
                        settlePayment(stripeSessionObject: $stripeSessionObject) {
                            stripePaymentStatus
                        }
                    }
                }
            }
        `),
        variables: {
            user: paymentAccept.user,
            stripeSessionId: paymentAccept.stripeSessionId,
            stripeSessionObject: JSON.stringify(session),
        },
    });
}

async function emailCustomerAboutFailedPayment(session: StripeSessionObject): Promise<void> {
    //
}
