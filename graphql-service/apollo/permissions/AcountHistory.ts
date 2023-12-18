import { AccountHistory } from "@/database/models/AccountHistory";
import { PK } from "@/database/utils";
import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";
import { isCurrentUserPK } from "./utils";

export const AccountHistoryPermissions = {
  async viewAccountHistoryPrivateAttributes(parent: AccountHistory, context: RequestContext): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    if (!context.currentUser) {
      return false;
    }
    return await Promise.resolve(parent.user === UserPK.stringify(context.currentUser));
  },

  async listAccountHistoryByUser({ user }: { user: PK }, context: RequestContext): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    return Promise.resolve(isCurrentUserPK(user, context));
  },

  async getAccountHistory(context: RequestContext): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    return Promise.resolve(context.currentUser !== undefined);
  },
};
