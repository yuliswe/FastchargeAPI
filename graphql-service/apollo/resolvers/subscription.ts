import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateSubscriptionArgs,
    GQLQuerySubscriptionArgs,
    GQLResolvers,
    GQLSubscribeUpdateSubscriptionArgs,
} from "../__generated__/resolvers-types";
import { Subscription } from "../dynamoose/models";
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
export const subscriptionResolvers: GQLResolvers = {
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
        async subscription(parent: {}, { pk, subscriber, app }: GQLQuerySubscriptionArgs, context: RequestContext) {
            let subscription: Subscription;
            if (pk) {
                subscription = await context.batched.Subscription.get(SubscriptionPK.parse(pk));
            } else {
                subscription = await context.batched.Subscription.get({
                    subscriber,
                    app,
                });
            }
            if (!(await Can.viewSubscription(subscription, { subscriber, app }, context))) {
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
            if (!(await Can.createSubscription({ pricing: pricingPK, subscriber }, context))) {
                throw new Denied();
            }
            let pricing = await context.batched.Pricing.get(PricingPK.parse(pricingPK)); // Checks if the pricing plan exists
            if (!pricing.visible) {
                throw new Denied("This pricing plan is not available for purchase.");
            }
            return await context.batched.Subscription.create({
                app: pricing.app,
                pricing: pricingPK,
                subscriber,
            });
        },
    },
};
