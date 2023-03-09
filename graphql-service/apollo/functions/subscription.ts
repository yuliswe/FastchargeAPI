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
 * @returns the Pricing object that the user is subscribed to, or null if the
 * user is not subscribed
 */
export async function findUserSubscriptionPricing(
    context: RequestContext,
    { user, app }: { user: string; app: string }
): Promise<Pricing | null> {
    let subscription = await findUserSubscription(context, { user, app });
    if (subscription == null) {
        return null;
    }
    return await context.batched.Pricing.getOrNull(PricingPK.parse(subscription.pricing));
}
