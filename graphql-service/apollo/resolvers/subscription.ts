import { GraphQLResolveInfo } from "graphql";
import { Subscribe } from "../dynamoose/models";
import { AlreadyExists, Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateSubscriptionArgs,
    GQLQuerySubscriptionArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { PricingPK } from "../functions/PricingPK";

export const subscribeResolvers: GQLResolvers = {
    Subscribe: {
        async pricing(
            parent: Subscribe,
            args: never,
            context: RequestContext,
            info
        ) {
            return await context.batched.Pricing.get(
                PricingPK.parse(parent.pricing)
            );
        },
        async subscriber(parent, args, context: RequestContext, info) {
            return await context.batched.User.get(parent.subscriber);
        },
        async app(parent, args, context: RequestContext, info) {
            return await context.batched.App.get(parent.app);
        },
        async deleteSubscription(
            parent: Subscribe,
            args: never,
            context,
            info
        ) {
            if (!(await Can.deleteSubscribe(parent, args, context))) {
                throw new Denied();
            }
            await parent.delete();
            return parent;
        },
    },
    Query: {
        async subscription(
            parent: never,
            args: GQLQuerySubscriptionArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            let subscribe = await context.batched.Subscribe.get(args);
            if (!(await Can.viewSubscribe(parent, args, context))) {
                throw new Denied();
            }
            return subscribe;
        },
    },
    Mutation: {
        async createSubscription(
            parent: never,
            args: GQLMutationCreateSubscriptionArgs,
            context,
            info
        ) {
            if (!(await Can.createSubscribe(args, context))) {
                throw new Denied();
            }
            let { app, pricing, subscriber } = args;
            await context.batched.Pricing.get(PricingPK.parse(pricing)); // Checks if the pricing plan exists
            await context.batched.User.get({ email: subscriber }); // Checks if the user exists
            let Subscribe = await context.batched.Subscribe.create(args);
            return Subscribe;
        },
    },
};
