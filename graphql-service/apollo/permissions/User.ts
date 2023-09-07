import { GQLUserUpdateUserArgs } from "@/__generated__/resolvers-types";
import { User } from "@/database/models";
import { RequestContext } from "../RequestContext";

export const UserPermissions = {
    async queryUser(user: User, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        return await Promise.resolve(context.currentUser != undefined && user.uid === context.currentUser.uid);
    },
    async viewUserPrivateAttributes(user: User, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(user.uid === context.currentUser.uid);
    },
    async createUserPrivateResources(user: User, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(user.uid === context.currentUser.uid);
    },
    async updateUser(
        user: User,
        { author, stripeCustomerId, stripeConnectAccountId }: GQLUserUpdateUserArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (stripeCustomerId || stripeConnectAccountId) {
            return context.isServiceRequest;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(user.uid === context.currentUser.uid);
    },
    async createUser(context: RequestContext): Promise<boolean> {
        return await Promise.resolve(context.isServiceRequest || context.isAdminUser);
    },
};
