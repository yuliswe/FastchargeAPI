import { App } from "@/src/database/models/App";
import { User } from "@/src/database/models/User";
import { UserAppToken } from "@/src/database/models/UserAppToken";
import { PK } from "@/src/database/utils";
import { isAdminOrServiceUser, isCurrentUser, isCurrentUserPK } from "@/src/permissions/utils";
import { RequestContext } from "@/src/RequestContext";

export const UserAppTokenPermissions = {
  async createUserAppToken(subscriber: User, context: RequestContext): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    return await Promise.resolve(isCurrentUser(subscriber, context));
  },
  async getUserAppToken(token: UserAppToken, context: RequestContext): Promise<boolean> {
    return Promise.resolve(isAdminOrServiceUser(context) || isCurrentUserPK(token.subscriber, context));
  },
  async getUserAppTokenBySubscriber({ subscriber }: { subscriber: PK }, context: RequestContext): Promise<boolean> {
    return Promise.resolve(isAdminOrServiceUser(context) || isCurrentUserPK(subscriber, context));
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
