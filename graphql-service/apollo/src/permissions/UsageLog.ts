import { UsageLog } from "@/src/database/models/UsageLog";
import { PK } from "@/src/database/utils";
import { isAdminOrServiceUser, isCurrentUserPK } from "@/src/permissions/utils";
import { UserPK } from "@/src/pks/UserPK";
import { RequestContext } from "@/src/RequestContext";

export const UsageLogPermissions = {
  async createUsageLog(context: RequestContext) {
    return await Promise.resolve(context.isServiceRequest);
  },
  async viewUsageLogPrivateAttributes(parent: UsageLog, context: RequestContext) {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    if (!context.currentUser) {
      return false;
    }
    return await Promise.resolve(parent.subscriber === UserPK.stringify(context.currentUser));
  },
  async listUsageLogsByAppSubscriber({ subscriber }: { subscriber: PK }, context: RequestContext) {
    return await Promise.resolve(isAdminOrServiceUser(context) || isCurrentUserPK(subscriber, context));
  },
};
