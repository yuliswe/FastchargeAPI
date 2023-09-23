import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { UserAppToken } from "@/database/models/UserAppToken";
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
