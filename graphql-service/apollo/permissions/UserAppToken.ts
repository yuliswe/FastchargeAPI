import { App, User, UserAppToken } from "@/database/models";
import { RequestContext } from "../RequestContext";
import { isCurrentUser, isCurrentUserPK } from "./utils";

export const UserAppTokenPermissions = {
    async createUserAppToken(subscriber: User, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        return await Promise.resolve(isCurrentUser(subscriber, context));
    },
    async queryUserAppToken(context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async revokeUserAppToken(parent: App, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewUserAppTokenPrivateAttributes(parent: UserAppToken, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        return await Promise.resolve(isCurrentUserPK(parent.subscriber, context));
    },
    async deleteUserAppToken(parent: UserAppToken, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        return await Promise.resolve(isCurrentUserPK(parent.subscriber, context));
    },
};
