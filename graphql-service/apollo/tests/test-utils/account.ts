import { RequestContext } from "../../RequestContext";
import { stripePaymentAcceptResolvers } from "../../resolvers/payment";

export async function addMoneyForUser(
    context: RequestContext,
    { user, amount }: { user: string; amount: string }
): Promise<void> {
    let stripePaymentAccept = await context.batched.StripePaymentAccept.create({
        user: user,
        amount: amount,
        currency: "usd",
        stripePaymentStatus: "paid",
        stripeSessionId: "test",
        stripePaymentIntent: "test",
        stripeSessionObject: {},
    });

    await stripePaymentAcceptResolvers.StripePaymentAccept.settlePayment(
        stripePaymentAccept,
        { stripeSessionObject: "{}" },
        context,
        {} as never
    );
}
