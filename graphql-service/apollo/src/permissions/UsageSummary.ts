import { UsageSummary } from "@/src/database/models/UsageSummary";
import { PK } from "@/src/database/utils";
import { isCurrentUserPK } from "@/src/permissions/utils";
import { AppPK } from "@/src/pks/AppPK";
import { RequestContext } from "@/src/RequestContext";

export const UsageSummaryPermissions = {
  async viewUsageSummaryPrivateAttributes(
    parent: UsageSummary,
    context: RequestContext,
    { allowAppOwner = false }: { allowAppOwner?: boolean } = {}
  ): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    if (!context.currentUser) {
      return false;
    }
    if (allowAppOwner) {
      const app = await context.batched.App.get(AppPK.parse(parent.app));
      if (isCurrentUserPK(app.owner, context)) {
        return true;
      }
    }
    return isCurrentUserPK(parent.subscriber, context);
  },
  async listUsageSummariesByAppSubscriber(
    { subscriber }: { subscriber: PK },
    context: RequestContext
  ): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    return Promise.resolve(isCurrentUserPK(subscriber, context));
  },
};
