import { GQLAppUpdateAppArgs } from "@/__generated__/resolvers-types";
import { App } from "@/database/models";
import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";

export const AppPermissions = {
    async createApp({ owner }: { owner: string }, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewAppHiddenPricingPlans(parent: App, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.owner === UserPK.stringify(context.currentUser));
    },
    async updateApp(
        parent: App,
        { title, description, homepage, repository }: GQLAppUpdateAppArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.owner === UserPK.stringify(context.currentUser));
    },
    async deleteApp(parent: App, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.owner === UserPK.stringify(context.currentUser));
    },
};
