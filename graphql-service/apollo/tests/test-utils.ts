import { RequestContext } from "../RequestContext";
import { GQLUserIndex } from "../__generated__/resolvers-types";
import { App, Pricing, FreeQuotaUsage } from "../dynamoose/models";
import { createUserWithEmail } from "../functions/user";
import { AppPK } from "../pks/AppPK";
import { stripePaymentAcceptResolvers } from "../resolvers/payment";

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

export async function getOrCreateTestUser(context: RequestContext, { email }: { email: string }) {
    let user = await context.batched.User.getOrNull({ email }, { using: GQLUserIndex.IndexByEmailOnlyPk });
    if (user === null) {
        user = await createUserWithEmail(context.batched, email);
    }
    return user;
}

export async function createOrUpdatePricing(
    context: RequestContext,
    { name, app }: { name: string; app: App },
    props: Partial<Pricing>
): Promise<Pricing> {
    let pricing = await context.batched.Pricing.getOrNull({ name, app: AppPK.stringify(app) });
    if (pricing === null) {
        pricing = await context.batched.Pricing.create({
            name,
            app: AppPK.stringify(app),
            ...props,
        });
    } else {
        pricing = await context.batched.Pricing.update(pricing, props);
    }
    return pricing;
}

export async function getOrCreateFreeQuotaUsage(
    context: RequestContext,
    {
        subscriber,
        app,
    }: {
        subscriber: string;
        app: string;
    }
): Promise<FreeQuotaUsage> {
    let freeQuotaUsage = await context.batched.FreeQuotaUsage.getOrNull({ subscriber, app });
    if (freeQuotaUsage === null) {
        freeQuotaUsage = await context.batched.FreeQuotaUsage.create({
            subscriber,
            app,
            usage: 0,
        });
    }
    return freeQuotaUsage;
}
