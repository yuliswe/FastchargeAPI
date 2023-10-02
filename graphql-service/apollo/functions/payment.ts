import { StripePaymentAcceptStatus } from "@/__generated__/gql/graphql";
import { AccountActivity } from "@/database/models/AccountActivity";
import { StripePaymentAccept } from "@/database/models/StripePaymentAccept";
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
        type: AccountActivityType.Debit,
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

export function getDedupIdForSettleStripePaymentAcceptSQS(stripePaymentAccept: StripePaymentAccept) {
    return ("settleStripePaymentAccept-" + StripePaymentAcceptPK.stringify(stripePaymentAccept)).slice(0, 128);
}
