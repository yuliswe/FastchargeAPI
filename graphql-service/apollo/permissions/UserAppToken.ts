import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { UserAppToken } from "@/database/models/UserAppToken";
import { PK } from "@/database/utils";
import { RequestContext } from "../RequestContext";
import { isAdminOrServiceUser, isCurrentUser, isCurrentUserPK } from "./utils";

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
