import { Subscription } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateSubscriptionArgs,
    GQLQuerySubscriptionArgs,
    GQLResolvers,
    GQLSubscribeUpdateSubscriptionArgs,
} from "../__generated__/resolvers-types";
import { PricingPK } from "../pks/PricingPK";
import { SubscriptionPK } from "../pks/SubscriptionPK";
import { UserPK } from "../pks/UserPK";
import { AppPK } from "../pks/AppPK";

export const subscribeResolvers: GQLResolvers = {
    Subscribe: {
        pk: (parent) => SubscriptionPK.stringify(parent),
        updatedAt: (parent) => parent.updatedAt,
        createdAt: (parent) => parent.createdAt,
        async pricing(parent: Subscription, args: {}, context: RequestContext) {
            return await context.batched.Pricing.get(PricingPK.parse(parent.pricing));
        },
        async subscriber(parent, args, context: RequestContext, info) {
            return await context.batched.User.get(UserPK.parse(parent.subscriber));
        },
        async app(parent, args, context: RequestContext, info) {
            return await context.batched.App.get(AppPK.parse(parent.app));
        },
        async deleteSubscription(parent: Subscription, args: {}, context) {
            if (!(await Can.deleteSubscribe(parent, args, context))) {
                throw new Denied();
            }
            await parent.delete();
            return parent;
        },

        async updateSubscription(
            parent: Subscription,
            { pricing }: GQLSubscribeUpdateSubscriptionArgs,
            context: RequestContext
        ): Promise<Subscription> {
            return context.batched.Subscription.update(parent, {
                pricing,
            });
        },
    },
    Query: {
        async subscription(parent: {}, { pk, subscriber, app }: GQLQuerySubscriptionArgs, context: RequestContext) {
            let subscribe: Subscription;
            if (pk) {
                subscribe = await context.batched.Subscription.get(SubscriptionPK.parse(pk));
            } else {
                subscribe = await context.batched.Subscription.get({
                    subscriber,
                    app,
                });
            }
            if (!(await Can.viewSubscribe(parent, { subscriber, app }, context))) {
                throw new Denied();
            }
            return subscribe;
        },
    },
    Mutation: {
        async createSubscription(parent: {}, { app, pricing, subscriber }: GQLMutationCreateSubscriptionArgs, context) {
            if (!(await Can.createSubscribe({ app, pricing, subscriber }, context))) {
                throw new Denied();
            }
            await context.batched.Pricing.get(PricingPK.parse(pricing)); // Checks if the pricing plan exists
            await context.batched.User.get(UserPK.parse(subscriber)); // Checks if the user exists
            let Subscribe = await context.batched.Subscription.create({
                app,
                pricing,
                subscriber,
            });
            return Subscribe;
        },
    },
};
