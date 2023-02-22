import { RequestContext } from "../RequestContext";
import { Pricing, Subscribe } from "../dynamoose/models";
import { PricingPK } from "./PricingPK";

export async function findUserSubscription(
    context: RequestContext,
    user: string
): Promise<Subscribe | null> {
    return await context.batched.Subscribe.getOrNull({
        subscriber: user,
    });
}

export async function findUserSubscriptionPricing(
    context: RequestContext,
    user: string,
    app
): Promise<Pricing | null> {
    let subscription = await findUserSubscription(context, user);
    if (subscription == null) {
        return null;
    }
    return await context.batched.Pricing.getOrNull(
        PricingPK.parse(subscription.pricing)
    );
}
