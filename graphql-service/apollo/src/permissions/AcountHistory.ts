import { AccountHistory } from "@/src/database/models/AccountHistory";
import { PK } from "@/src/database/utils";
import { isCurrentUserPK } from "@/src/permissions/utils";
import { UserPK } from "@/src/pks/UserPK";
import { RequestContext } from "@/src/RequestContext";

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
