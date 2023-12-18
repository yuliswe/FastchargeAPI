import { UsageLog } from "@/database/models/UsageLog";
import { PK } from "@/database/utils";
import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";
import { isAdminOrServiceUser, isCurrentUserPK } from "./utils";

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
