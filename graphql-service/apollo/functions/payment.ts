import { RequestContext } from "../RequestContext";
import { AccountActivity, StripePaymentAccept } from "../dynamoose/models";
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
    let activity = await context.batched.AccountActivity.create({
        user: stripePaymentAccept.user,
        amount: stripePaymentAccept.amount,
        type: "debit",
        reason: "topup",
        settleAt: Date.now(),
        description: "Account top-up by you",
        stripePaymentAccept: StripePaymentAcceptPK.stringify(stripePaymentAccept),
    });
    stripePaymentAccept = await context.batched.StripePaymentAccept.update(stripePaymentAccept, {
        stripeSessionObject: stripeSessionObject,
        accountActivity: AccountActivityPK.stringify(activity),
        status: "settled",
    });
    return {
        createdAccountActivity: activity,
        updatedStripePaymentAccept: stripePaymentAccept,
    };
}
