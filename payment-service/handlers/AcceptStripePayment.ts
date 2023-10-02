import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { StripePaymentAccept } from "@/database/models/StripePaymentAccept";
import { User, UserTableIndex } from "@/database/models/User";
import { UserPK } from "@/pks/UserPK";
import { baseDomain } from "@/runtime-config";
import { SQSQueueName, sqsGQLClient } from "@/sqsClient";
import { gql } from "@apollo/client";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import crypto from "crypto";
import Decimal from "decimal.js-light";
import { Stripe } from "stripe";
import {
    GQLFulfillUserStripePaymentAcceptQuery,
    GQLFulfillUserStripePaymentAcceptQueryVariables,
    GQLMutationCreateStripePaymentAcceptArgs,
} from "../__generated__/gql-operations";
import { getPaymentAcceptedEmail } from "../email-templates/payment-accepted";
import { LambdaEventV2, LambdaHandlerV2 } from "../utils/LambdaContext";
import { parseStripeWebhookEvent } from "../utils/stripe-client";
import { StripePaymentAcceptStatus } from "@/__generated__/resolvers-types";

const chalk = new Chalk({ level: 3 });

const context: RequestContext = {
    service: "payment",
    isServiceRequest: true,
    isSQSMessage: false,
    batched: createDefaultContextBatched(),
    isAnonymousUser: false,
    isAdminUser: false,
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
    const stripeEvent = await parseStripeEvent(event);

    if (process.env.LOGGING == "1") {
        console.log(chalk.yellow("Stripe event: " + JSON.stringify(stripeEvent)));
    }

    switch (stripeEvent.type) {
        case "checkout.session.completed": {
            const session = stripeEvent.data.object as StripeSessionObject;
            const amount = new Decimal(session.amount_total).div(100).toString();
            const email = session.customer_details.email;
            if (!email) {
                throw new Error("Email not found in Stripe session.");
            }
            const user = await context.batched.User.get({ email }, { using: UserTableIndex.IndexByEmailOnlyPk });
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
            const session = stripeEvent.data.object as StripeSessionObject;
            const email = session.customer_details.email;
            const user = await context.batched.User.get({ email }, { using: UserTableIndex.IndexByEmailOnlyPk });
            const paymentAccept = await context.batched.StripePaymentAccept.get({
                user: UserPK.stringify(user),
            });
            await fulfillOrder(session, paymentAccept);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Order fulfilled asynchronously.",
                }),
            };
        }
        case "checkout.session.async_payment_failed": {
            const session = stripeEvent.data.object as StripeSessionObject;
            await emailCustomerAboutFailedPayment(session);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Customer notified of failed payment.",
                }),
            };
        }
        case "checkout.session.expired": {
            const session = stripeEvent.data.object as StripeSessionObject;
            const email = session.customer_details.email;
            const user = await context.batched.User.get({ email }, { using: UserTableIndex.IndexByEmailOnlyPk });
            const paymentAccept = await context.batched.StripePaymentAccept.get({
                user: UserPK.stringify(user),
            });
            await context.batched.StripePaymentAccept.update(paymentAccept, {
                status: StripePaymentAcceptStatus.Expired,
                stripePaymentStatus: "expired",
            });
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Payment marked as expired.",
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
    const billingQueueClient = sqsGQLClient({
        queueName: SQSQueueName.BillingQueue,
        groupId: UserPK.stringify(user),
        dedupId: `createAndFufillOrder-${UserPK.stringify(user)}-${md5(session.id)}`,
    });
    await billingQueueClient.mutate<void, GQLMutationCreateStripePaymentAcceptArgs>({
        mutation: gql(`
            mutation CreateStripePaymentAcceptAndSettle($user: ID!, $amount: NonNegativeDecimal!, $stripeSessionId: String!, $stripeSessionObject: String!, $stripePaymentIntent: String!, $stripePaymentStatus: String!) {
                createStripePaymentAccept(user: $user, amount: $amount, stripeSessionId: $stripeSessionId, stripeSessionObject: $stripeSessionObject, stripePaymentIntent: $stripePaymentIntent, stripePaymentStatus: $stripePaymentStatus) {
                    settleStripePaymentAccept {
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
    await notifyUserOfSuccessfulPayment(session, user, amount);
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
    const billingQueueClient = sqsGQLClient({
        queueName: SQSQueueName.BillingQueue,
        groupId: UserPK.stringify(user),
        dedupId: `createOrder-${UserPK.stringify(user)}-${session.id}`,
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
async function fulfillOrder(session: StripeSessionObject, paymentAccept: StripePaymentAccept): Promise<void> {
    // console.log(chalk.yellow("Fulfilling order"), paymentAccept, session);
    // Settling the payment must be done on the billing queue
    const billingQueueClient = sqsGQLClient({
        queueName: SQSQueueName.BillingQueue,
        groupId: paymentAccept.user,
        dedupId: md5(`${paymentAccept.user}-fulfillOrder-${session.id}`),
    });
    await billingQueueClient.query<
        GQLFulfillUserStripePaymentAcceptQuery,
        GQLFulfillUserStripePaymentAcceptQueryVariables
    >({
        query: gql(`
            query FulfillUserStripePaymentAccept($user: ID!, $stripeSessionId: String!, $stripeSessionObject: String!, $stripePaymentStatus: String!, $stripePaymentIntent: String!,
               ) {
                getStripePaymentAcceptByStripeSessionId(user: $user, stripeSessionId: $stripeSessionId) {
                    settleStripePaymentAccept(stripeSessionObject: $stripeSessionObject, stripePaymentStatus:$stripePaymentStatus, stripePaymentIntent: $stripePaymentIntent) {
                        stripePaymentStatus
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
    const user = await context.batched.User.get(UserPK.parse(paymentAccept.user));
    await notifyUserOfSuccessfulPayment(session, user, paymentAccept.amount);
}

async function emailCustomerAboutFailedPayment(session: StripeSessionObject): Promise<void> {
    //
}

async function notifyUserOfSuccessfulPayment(session: StripeSessionObject, user: User, amount: string): Promise<void> {
    const sesClient = new SESClient({});
    await sesClient.send(
        new SendEmailCommand({
            Destination: {
                ToAddresses: [
                    process.env.NODE_ENV == "test"
                        ? "testuser1.fastchargeapi@gmail.com"
                        : session.customer_details.email,
                ],
            },
            Message: {
                Subject: {
                    Charset: "UTF-8",
                    Data: `A topup of $${amount} has been added to your account`,
                },
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: getPaymentAcceptedEmail({
                            paymentAmount: amount,
                            userName: user.author ?? user.email,
                        }),
                    },
                },
            },
            Source: `FastchargeAPI <topup@${baseDomain}>`,
        })
    );
}

function md5(content: string) {
    const hash = crypto.createHash("md5").update(content).digest("hex");
    return hash;
}
