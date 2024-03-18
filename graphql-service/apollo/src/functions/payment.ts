import { RequestContext } from "@/src/RequestContext";
import { StripePaymentAcceptStatus } from "@/src/__generated__/gql/graphql";
import { AccountActivityReason, AccountActivityType } from "@/src/__generated__/resolvers-types";
import { AccountActivity } from "@/src/database/models/AccountActivity";
import { StripePaymentAccept } from "@/src/database/models/StripePaymentAccept";
import { AlreadyExists } from "@/src/errors";
import { AccountActivityPK } from "@/src/pks/AccountActivityPK";
import { StripePaymentAcceptPK } from "@/src/pks/StripePaymentAccept";
import { SQSQueueName, getSQSClient } from "@/src/sqsClient";
import { graphql } from "@/src/typed-graphql";

export type GenerateAccountActivityForStripePaymentResult = {
  createdAccountActivity: AccountActivity;
  updatedStripePaymentAccept: StripePaymentAccept;
};
export async function generateAccountActivityForStripePayment(
  context: RequestContext,
  {
    stripePaymentAccept,
    stripeSessionObject,
  }: { stripePaymentAccept: StripePaymentAccept; stripeSessionObject: object }
): Promise<GenerateAccountActivityForStripePaymentResult> {
  const activity = await context.batched.AccountActivity.create({
    user: stripePaymentAccept.user,
    amount: stripePaymentAccept.amount,
    type: AccountActivityType.Incoming,
    reason: AccountActivityReason.Topup,
    settleAt: Date.now(),
    description: "Account top-up by you",
    stripePaymentAccept: StripePaymentAcceptPK.stringify(stripePaymentAccept),
  });
  stripePaymentAccept = await context.batched.StripePaymentAccept.update(stripePaymentAccept, {
    stripeSessionObject,
    accountActivity: AccountActivityPK.stringify(activity),
    status: StripePaymentAcceptStatus.Settled,
  });
  return {
    createdAccountActivity: activity,
    updatedStripePaymentAccept: stripePaymentAccept,
  };
}

export function getSQSDedupIdForSettleStripePaymentAccept(stripePaymentAccept: StripePaymentAccept) {
  return ("settleStripePaymentAccept-" + StripePaymentAcceptPK.stringify(stripePaymentAccept)).slice(0, 128);
}

export async function createStripePaymentAcceptAndSettleOnSQS(
  context: RequestContext,
  args: {
    user: string;
    amount: string;
    stripeSessionId: string;
    stripeSessionObject: string;
    stripePaymentIntent: string;
    stripePaymentStatus: string;
  }
) {
  const { user, amount, stripeSessionId, stripeSessionObject, stripePaymentIntent, stripePaymentStatus } = args;

  const existing = await context.batched.StripePaymentAccept.getOrNull({
    user,
    stripeSessionId,
  });
  if (existing) {
    throw new AlreadyExists("StripePaymentAccept", { user, stripeSessionId });
  }
  const stripePaymentAccept = await context.batched.StripePaymentAccept.create({
    user,
    amount,
    stripeSessionId,
    stripeSessionObject: JSON.parse(stripeSessionObject) as object,
    stripePaymentIntent,
    stripePaymentStatus,
  });
  await getSQSClient({
    queueName: SQSQueueName.BillingQueue,
    dedupId: getSQSDedupIdForSettleStripePaymentAccept(stripePaymentAccept),
    groupId: user,
  }).mutate({
    mutation: graphql(`
      mutation CreateStripePaymentAcceptAndSettleOnSQS(
        $pk: ID!
        $stripePaymentStatus: String
        $stripeSessionObject: String
        $stripePaymentIntent: String
      ) {
        getStripePaymentAccept(pk: $pk) {
          _sqsSettleStripePaymentAccept(
            stripePaymentStatus: $stripePaymentStatus
            stripeSessionObject: $stripeSessionObject
            stripePaymentIntent: $stripePaymentIntent
          ) {
            pk
          }
        }
      }
    `),
    variables: {
      pk: StripePaymentAcceptPK.stringify(stripePaymentAccept),
      stripePaymentStatus,
      stripeSessionObject,
      stripePaymentIntent,
    },
  });
  return stripePaymentAccept;
}