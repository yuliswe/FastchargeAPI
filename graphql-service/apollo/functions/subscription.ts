import { RequestContext } from "../RequestContext";
import { Pricing, Subscription } from "../dynamoose/models";
import { PricingPK } from "../pks/PricingPK";

export async function findUserSubscription(
    context: RequestContext,
    { user, app }: { user: string; app: string }
): Promise<Subscription | null> {
    return await context.batched.Subscription.getOrNull({
        subscriber: user,
        app,
    });
}

/**
 * Returns the Pricing object that the user is subscribed to, and validate that
 * the pricing oject is valid (because pricing is an deletable resource).
 * Returns null if the user is not subscribed, or the pricing has been deleted.
 * @returns pricing object or null
 */
export async function findUserSubscriptionPricing(
    context: RequestContext,
    { user, app }: { user: string; app: string }
): Promise<Pricing | null> {
    const subscription = await findUserSubscription(context, { user, app });
    if (subscription == null) {
        return null;
    }
    return await context.batched.Pricing.getOrNull(PricingPK.parse(subscription.pricing));
}
