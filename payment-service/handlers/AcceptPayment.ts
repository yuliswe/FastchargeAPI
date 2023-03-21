import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import { LambdaEventV2, LambdaHandlerV2 } from "../utils/LambdaContext";
import { RequestContext, UserPK, createDefaultContextBatched, sqsGQLClient } from "graphql-service";
import { parseStripeWebhookEvent } from "../utils/stripe-client";
import { StripePaymentAccept, User } from "graphql-service/dynamoose/models";
import { SQSQueueUrl } from "graphql-service/cron-jobs/sqsClient";
import { gql } from "@apollo/client";
import Decimal from "decimal.js-light";
import {
    GQLFulfillUserStripePaymentAcceptQuery,
    GQLFulfillUserStripePaymentAcceptQueryVariables,
    GQLMutationCreateStripePaymentAcceptArgs,
    GQLUserIndex,
} from "../__generated__/gql-operations";
import { Stripe } from "stripe";
import crypto from "crypto";

const chalk = new Chalk({ level: 3 });

export const context: RequestContext = {
    service: "payment",
    isServiceRequest: true,
    isSQSMessage: false,
    batched: createDefaultContextBatched(),
};

export type StripeSessionObject = {
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
        parseStripeEvent,
    }: {
        parseStripeEvent: (event: LambdaEventV2) => Promise<Stripe.Event> | Stripe.Event; // Allows mocking in tests
    } = {
        parseStripeEvent: parseStripeWebhookEvent,
    }
): Promise<APIGatewayProxyStructuredResultV2> {
    let stripeEvent = await parseStripeEvent(event);

    if (process.env.LOGGING == "1") {
        console.log(chalk.yellow("Stripe event: " + JSON.stringify(stripeEvent)));
    }

    switch (stripeEvent.type) {
        case "checkout.session.completed": {
            let session = stripeEvent.data.object as StripeSessionObject;
            let amount = new Decimal(session.amount_total).div(100).toString();
            let email = session.customer_details.email;
            if (!email) {
                throw new Error("Email not found in Stripe session.");
            }
            let user = await context.batched.User.get({ email }, { using: GQLUserIndex.IndexByEmailOnlyPk });
            // Check if the order is already paid (for example, from a card
            // payment)
            //
            // A delayed notification payment will have an `unpaid` status, as
            // you're still waiting for funds to be transferred from the
            // customer's account.
            if (session.payment_status === "paid") {
                // Save an order in your database, marked as 'awaiting payment'
                await createAndFufillOrder({ session, user, amount });
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: "Order created and fulfilled.",
                    }),
                };
            } else {
                await createOrder({ session, user, amount });
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
            let user = await context.batched.User.get({ email }, { using: GQLUserIndex.IndexByEmailOnlyPk });
            let paymentAccept = await context.batched.StripePaymentAccept.get({
                user: UserPK.stringify(user),
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

/**
 * Must be done on the billing queue so that the creation of StripePaymentAccept is idempotent.
 */
async function createAndFufillOrder({
    session,
    user,
    amount,
}: {
    session: StripeSessionObject;
    user: User;
    amount: string;
}): Promise<void> {
    let billingQueueClient = sqsGQLClient({
        queueUrl: SQSQueueUrl.BillingFifoQueue,
        dedupId: md5(`${UserPK.stringify(user)}-createAndFufillOrder-${session.id}`),
    });
    await billingQueueClient.mutate<void, GQLMutationCreateStripePaymentAcceptArgs>({
        mutation: gql(`
            mutation CreateStripePaymentAcceptAndSettle($user: ID!, $amount: NonNegativeDecimal!, $stripeSessionId: String!, $stripeSessionObject: String!, $stripePaymentIntent: String!, $stripePaymentStatus: String!) {
                createStripePaymentAccept(user: $user, amount: $amount, stripeSessionId: $stripeSessionId, stripeSessionObject: $stripeSessionObject, stripePaymentIntent: $stripePaymentIntent, stripePaymentStatus: $stripePaymentStatus) {
                    settlePayment {
                        status
                    }
                }
            }
        `),
        variables: {
            user: UserPK.stringify(user),
            amount,
            stripeSessionId: session.id,
            stripeSessionObject: JSON.stringify(session),
            stripePaymentIntent: session.payment_intent,
            stripePaymentStatus: session.payment_status,
        },
    });
}

/**
 * Must be done on the billing queue so that the creation of StripePaymentAccept is idempotent.
 */
async function createOrder({
    session,
    user,
    amount,
}: {
    session: StripeSessionObject;
    user: User;
    amount: string;
}): Promise<void> {
    // console.log(chalk.yellow("Creating order"), email, amount, session);
    let billingQueueClient = sqsGQLClient({
        queueUrl: SQSQueueUrl.BillingFifoQueue,
        dedupId: md5(`${UserPK.stringify(user)}-createOrder-${session.id}`),
    });
    await billingQueueClient.mutate<void, GQLMutationCreateStripePaymentAcceptArgs>({
        mutation: gql(`
            mutation CreateStripePaymentAccept($user: ID!, $amount: NonNegativeDecimal!, $stripeSessionId: String!, $stripeSessionObject: String!, $stripePaymentIntent: String!, $stripePaymentStatus: String!) {
                createStripePaymentAccept(user: $user, amount: $amount, stripeSessionId: $stripeSessionId, stripeSessionObject: $stripeSessionObject, stripePaymentIntent: $stripePaymentIntent, stripePaymentStatus: $stripePaymentStatus) {
                    createdAt
                }
            }
        `),
        variables: {
            user: UserPK.stringify(user),
            amount,
            stripeSessionId: session.id,
            stripeSessionObject: JSON.stringify(session),
            stripePaymentIntent: session.payment_intent,
            stripePaymentStatus: session.payment_status,
        },
    });
}

/**
 * Must be done on the billing queue so that the update of StripePaymentAccept is idempotent.
 */
async function fulfillOrder(paymentAccept: StripePaymentAccept, session: StripeSessionObject): Promise<void> {
    // console.log(chalk.yellow("Fulfilling order"), paymentAccept, session);
    // Settling the payment must be done on the billing queue
    let billingQueueClient = sqsGQLClient({
        queueUrl: SQSQueueUrl.BillingFifoQueue,
        dedupId: md5(`${paymentAccept.user}-fulfillOrder-${session.id}`),
    });
    await billingQueueClient.query<
        GQLFulfillUserStripePaymentAcceptQuery,
        GQLFulfillUserStripePaymentAcceptQueryVariables
    >({
        query: gql(`
            query FulfillUserStripePaymentAccept($user: ID!, $stripeSessionId: String!, $stripeSessionObject: String!, $stripePaymentStatus: String!, $stripePaymentIntent: String!,
               ) {
                user(pk: $user) {
                    stripePaymentAccept(stripeSessionId: $stripeSessionId) {
                        settlePayment(stripeSessionObject: $stripeSessionObject, stripePaymentStatus:$stripePaymentStatus, stripePaymentIntent: $stripePaymentIntent) {
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
            stripePaymentStatus: session.payment_status,
            stripePaymentIntent: session.payment_intent,
        },
    });
}

async function emailCustomerAboutFailedPayment(session: StripeSessionObject): Promise<void> {
    //
}

function md5(content: string) {
    let hash = crypto.createHash("md5").update(content).digest("hex");
    return hash;
}
