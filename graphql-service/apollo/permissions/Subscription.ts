import {
    GQLMutationCreateSubscriptionArgs,
    GQLQuerySubscriptionArgs,
    GQLSubscribeUpdateSubscriptionArgs,
} from "@/__generated__/resolvers-types";
import { Subscription } from "@/database/models/Subscription";
import { RequestContext } from "../RequestContext";
import { AppPK } from "../pks/AppPK";
import { UserPK } from "../pks/UserPK";

export const SubscriptionPermissions = {
    async viewSubscriptionPrivateAttributes(parent: Subscription, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (parent.subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        if (app.owner === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return false;
    },
    async createSubscription(
        { pricing, subscriber }: GQLMutationCreateSubscriptionArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return Promise.resolve(false);
    },
    async updateSubscription(
        parent: Subscription,
        { pricing }: GQLSubscribeUpdateSubscriptionArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (parent.subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return Promise.resolve(false);
    },
    async deleteSubscription(parent: Subscription, args: {}, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (parent.subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return Promise.resolve(false);
    },
    async viewSubscription(
        subscription: Subscription,
        args: GQLQuerySubscriptionArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (subscription.subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        const app = await context.batched.App.get(AppPK.parse(subscription.app));
        if (app.owner === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return false;
    },
};
