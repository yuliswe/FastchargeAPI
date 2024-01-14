import { GQLQueryListAccountActivitiesByUserArgs } from "@/__generated__/resolvers-types";
import { AccountActivity } from "@/database/models/AccountActivity";
import { RequestContext } from "../RequestContext";
import { isAdminOrServiceUser, isCurrentUserPK } from "./utils";

export const AccountActivityPermissions = {
  async viewAccountActivityPrivateAttributes(parent: AccountActivity, context: RequestContext): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    return await Promise.resolve(isCurrentUserPK(parent.user, context));
  },
  async queryAccountActivity(parent: AccountActivity, context: RequestContext): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    return await Promise.resolve(isCurrentUserPK(parent.user, context));
  },
  async createAccountActivity(context: RequestContext): Promise<boolean> {
    return Promise.resolve(context.isServiceRequest || context.isAdminUser);
  },
  async listAccountActivitiesByUser(
    args: GQLQueryListAccountActivitiesByUserArgs,
    context: RequestContext
  ): Promise<boolean> {
    const { user } = args;
    return Promise.resolve(isCurrentUserPK(user, context) || isAdminOrServiceUser(context));
  },
};
