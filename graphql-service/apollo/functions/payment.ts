import { StripePaymentAcceptStatus } from "@/__generated__/gql/graphql";
import { AccountActivity } from "@/database/models/AccountActivity";
import { StripePaymentAccept } from "@/database/models/StripePaymentAccept";
import { AlreadyExists } from "@/errors";
import { SQSQueueName, getSQSClient } from "@/sqsClient";
import { graphql } from "@/typed-graphql";
import { RequestContext } from "../RequestContext";
import { AccountActivityReason, AccountActivityType } from "../__generated__/resolvers-types";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { StripePaymentAcceptPK } from "../pks/StripePaymentAccept";

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
        stripeSessionObject: stripeSessionObject,
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
        user: user,
        stripeSessionId: stripeSessionId,
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
        stripePaymentStatus: stripePaymentStatus,
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
