import { RequestContext } from "@/RequestContext";
import { StripePaymentAcceptStatus } from "@/__generated__/resolvers-types";
import { StripePaymentAccept } from "@/database/models/StripePaymentAccept";
import { User, UserTableIndex } from "@/database/models/User";
import { UserPK } from "@/pks/UserPK";
import { baseDomain } from "@/runtime-config";
import { SQSQueueName, getSQSClient } from "@/sqsClient";
import { gql } from "@apollo/client";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import Decimal from "decimal.js-light";
import { getSQSDedupIdForSettleStripePaymentAccept } from "graphql-service-apollo/functions/payment";
import { baseRequestContext } from "graphql-service-apollo/tests/test-utils/test-utils";
import {
  GQLFulfillUserStripePaymentAcceptQuery,
  GQLFulfillUserStripePaymentAcceptQueryVariables,
} from "../__generated__/gql-operations";
import { getPaymentAcceptedEmail } from "../email-templates/payment-accepted";
import { LambdaEventV2, LambdaHandlerV2 } from "../utils/LambdaContext";
import { parseStripeWebhookEvent } from "../utils/stripe-client";

const chalk = new Chalk({ level: 3 });

export type StripeSessionObject = {
  id: string;
  object: "checkout.session";
  payment_status: "paid" | "unpaid";
  customer_details: { email: string };
  payment_intent: string;
  customer: string; // Stripe customer ID
  amount_total: number; // In cents
};

export async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const context: RequestContext = {
    ...baseRequestContext,
    service: "payment",
    isServiceRequest: true,
  };

  const stripeEvent = await parseStripeWebhookEvent(event);

  console.log(chalk.yellow("Stripe event: " + JSON.stringify(stripeEvent)));

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
        await createOrder(context, { session, user, amount });
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
      await fulfillOrder(context, { session, paymentAccept });
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
  await getSQSClient({
    queueName: SQSQueueName.BillingQueue,
    groupId: UserPK.stringify(user),
    dedupId: `CreateStripePaymentAcceptAndSettle-${UserPK.stringify(user)}-${session.id}`,
  }).mutate({
    mutation: gql(`
            mutation CreateStripePaymentAcceptAndSettle($user: ID!, 
            $amount: NonNegativeDecimal!, 
            $stripeSessionId: String!, 
            $stripeSessionObject: String!, 
            $stripePaymentIntent: String!, 
            $stripePaymentStatus: String!
        ) {
                createStripePaymentAccept(user: $user, 
                amount: $amount, 
                stripeSessionId: $stripeSessionId, 
                stripeSessionObject: $stripeSessionObject, 
                stripePaymentIntent: $stripePaymentIntent, 
                stripePaymentStatus: $stripePaymentStatus, 
                settleImmediately: true) {
                    pk
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

async function createOrder(
  context: RequestContext,
  args: {
    session: StripeSessionObject;
    user: User;
    amount: string;
  }
): Promise<StripePaymentAccept> {
  const { session, user, amount } = args;
  return await context.batched.StripePaymentAccept.createOverwrite({
    user: UserPK.stringify(user),
    amount,
    stripeSessionId: session.id,
    stripeSessionObject: session,
    stripePaymentIntent: session.payment_intent,
    stripePaymentStatus: session.payment_status,
  });
}

/**
 * Must be done on the billing queue so that the update of StripePaymentAccept is idempotent.
 */
async function fulfillOrder(
  context: RequestContext,
  args: { session: StripeSessionObject; paymentAccept: StripePaymentAccept }
): Promise<void> {
  const { session, paymentAccept } = args;
  const billingQueueClient = getSQSClient({
    queueName: SQSQueueName.BillingQueue,
    groupId: paymentAccept.user,
    dedupId: getSQSDedupIdForSettleStripePaymentAccept(paymentAccept),
  });
  await billingQueueClient.query<
    GQLFulfillUserStripePaymentAcceptQuery,
    GQLFulfillUserStripePaymentAcceptQueryVariables
  >({
    query: gql(`
            query FulfillUserStripePaymentAccept($user: ID!, $stripeSessionId: String!, $stripeSessionObject: String!, $stripePaymentStatus: String!, $stripePaymentIntent: String!,
               ) {
                getStripePaymentAcceptByStripeSessionId(user: $user, stripeSessionId: $stripeSessionId) {
                    _sqsSettleStripePaymentAccept(stripeSessionObject: $stripeSessionObject, stripePaymentStatus:$stripePaymentStatus, stripePaymentIntent: $stripePaymentIntent) {
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
          process.env.NODE_ENV == "test" ? "testuser1.fastchargeapi@gmail.com" : session.customer_details.email,
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
