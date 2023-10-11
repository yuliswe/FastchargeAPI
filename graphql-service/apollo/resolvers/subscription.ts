import { Subscription } from "@/database/models/Subscription";
import { AppPK } from "@/pks/AppPK";
import { RequestContext } from "../RequestContext";
import { AppVisibility, PricingAvailability } from "../__generated__/gql/graphql";
import {
    GQLMutationCreateSubscriptionArgs,
    GQLQueryGetSubscriptionArgs,
    GQLQueryGetSubscriptionByAppSubscriberArgs,
    GQLResolvers,
    GQLSubscribeUpdateSubscriptionArgs,
} from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { PricingPK } from "../pks/PricingPK";
import { SubscriptionPK } from "../pks/SubscriptionPK";
import { UserPK } from "../pks/UserPK";

/**
 * Make is so that only the app owner and the subscriber can read the private
 * attributes.
 */
function makePrivate<T>(
    getter: (parent: Subscription, args: {}, context: RequestContext) => T
): (parent: Subscription, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: Subscription, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewSubscriptionPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}
export const SubscriptionResolvers: GQLResolvers = {
    Subscribe: {
        pk: makePrivate((parent) => SubscriptionPK.stringify(parent)),
        updatedAt: makePrivate((parent) => parent.updatedAt),
        createdAt: makePrivate((parent) => parent.createdAt),
        pricing: makePrivate((parent, _, context) => context.batched.Pricing.get(PricingPK.parse(parent.pricing))),
        subscriber: makePrivate((parent, _, context) => context.batched.User.get(UserPK.parse(parent.subscriber))),
        app: makePrivate((parent, _, context) => context.batched.App.get(AppPK.parse(parent.app))),

        async deleteSubscription(parent: Subscription, args: {}, context) {
            if (!(await Can.deleteSubscription(parent, args, context))) {
                throw new Denied();
            }
            return await context.batched.Subscription.delete(parent);
        },

        async updateSubscription(
            parent: Subscription,
            { pricing }: GQLSubscribeUpdateSubscriptionArgs,
            context: RequestContext
        ): Promise<Subscription> {
            if (!(await Can.updateSubscription(parent, { pricing }, context))) {
                throw new Denied();
            }
            return context.batched.Subscription.update(parent, {
                pricing: pricing ?? undefined,
            });
        },
    },
    Query: {
        async getSubscription(parent: {}, { pk }: GQLQueryGetSubscriptionArgs, context: RequestContext) {
            const subscription = await context.batched.Subscription.get(SubscriptionPK.parse(pk));
            if (!(await Can.getSubscription(subscription, context))) {
                throw new Denied();
            }
            return subscription;
        },

        async getSubscriptionByAppSubscriber(
            parent: {},
            { subscriber, app }: GQLQueryGetSubscriptionByAppSubscriberArgs,
            context: RequestContext
        ) {
            const subscription = await context.batched.Subscription.get({
                subscriber,
                app,
            });
            if (!(await Can.getSubscriptionByAppSubscriber(subscription, context))) {
                throw new Denied();
            }
            return subscription;
        },
    },
    Mutation: {
        async createSubscription(parent: {}, { pricing, subscriber }: GQLMutationCreateSubscriptionArgs, context) {
            const pricingObj = await context.batched.Pricing.getOrNull(PricingPK.parse(pricing)); // Checks if the pricing plan exists
            if (!pricingObj || pricingObj.availability !== PricingAvailability.Public) {
                // Pricing was deleted
                throw new Denied("This pricing plan is not available for purchase.");
            }
            const appObj = await context.batched.App.get(AppPK.parse(pricingObj.app));
            if (appObj.visibility !== AppVisibility.Public) {
                throw new Denied("This app is not available for purchase.");
            }
            if (!(await Can.createSubscription({ pricing: pricing, subscriber }, context))) {
                throw new Denied();
            }
            return await context.batched.Subscription.create({
                app: pricingObj.app,
                pricing: pricing,
                subscriber,
            });
        },
    },
};

/* Deprecated */
SubscriptionResolvers.Query!.subscription = SubscriptionResolvers.Query!.getSubscription!;
