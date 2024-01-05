import { GQLUserUpdateUserArgs } from "@/__generated__/resolvers-types";
import { User } from "@/database/models/User";
import { isAdminOrServiceUser, isCurrentUser } from "@/permissions/utils";
import { RequestContext } from "../RequestContext";

export const UserPermissions = {
  async getUser(user: User, context: RequestContext): Promise<boolean> {
    if (isAdminOrServiceUser(context)) {
      return true;
    }
    return Promise.resolve(isCurrentUser(user, context));
  },
  async getUserByEmail(user: User, context: RequestContext): Promise<boolean> {
    if (isAdminOrServiceUser(context)) {
      return true;
    }
    return Promise.resolve(isCurrentUser(user, context));
  },
  async viewUserPrivateAttributes(user: User, context: RequestContext): Promise<boolean> {
    if (isAdminOrServiceUser(context)) {
      return true;
    }
    if (!context.currentUser) {
      return false;
    }
    return await Promise.resolve(user.uid === context.currentUser.uid);
  },
  async createUserPrivateResources(user: User, context: RequestContext): Promise<boolean> {
    if (isAdminOrServiceUser(context)) {
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
    if (isAdminOrServiceUser(context)) {
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
    return await Promise.resolve(isAdminOrServiceUser(context));
  },
};
