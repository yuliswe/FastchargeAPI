import { Subscription } from "@/database/models/Subscription";
import { RequestContext } from "../RequestContext";
import { PricingAvailability } from "../__generated__/gql/graphql";
import {
    GQLMutationCreateSubscriptionArgs,
    GQLQueryGetSubscriptionArgs,
    GQLQueryGetSubscriptionByAppSubscriberArgs,
    GQLResolvers,
    GQLSubscribeUpdateSubscriptionArgs,
} from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { AppPK } from "../pks/AppPK";
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
        async pricing(parent: Subscription, args: {}, context: RequestContext) {
            if (!(await Can.viewSubscriptionPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await context.batched.Pricing.get(PricingPK.parse(parent.pricing));
        },
        async subscriber(parent, args, context: RequestContext, info) {
            if (!(await Can.viewSubscriptionPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await context.batched.User.get(UserPK.parse(parent.subscriber));
        },
        async app(parent, args, context: RequestContext, info) {
            if (!(await Can.viewSubscriptionPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await context.batched.App.get(AppPK.parse(parent.app));
        },
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
                pricing,
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
        async createSubscription(
            parent: {},
            { pricing: pricingPK, subscriber }: GQLMutationCreateSubscriptionArgs,
            context
        ) {
            const pricing = await context.batched.Pricing.getOrNull(PricingPK.parse(pricingPK)); // Checks if the pricing plan exists
            if (!pricing || pricing.availability !== PricingAvailability.Public) {
                // Pricing was deleted
                throw new Denied("This pricing plan is not available for purchase.");
            }
            if (!(await Can.createSubscription({ pricing: pricingPK, subscriber }, context))) {
                throw new Denied();
            }
            return await context.batched.Subscription.create({
                app: pricing.app,
                pricing: pricingPK,
                subscriber,
            });
        },
    },
};

/* Deprecated */
SubscriptionResolvers.Query!.subscription = SubscriptionResolvers.Query!.getSubscription!;
