import { AppTag } from "@/src/database/models/AppTag";
import { isAdminOrServiceUser, isCurrentUserPK } from "@/src/permissions/utils";
import { AppPK } from "@/src/pks/AppPK";
import { RequestContext } from "@/src/RequestContext";

export const AppTagPermissions = {
  async createAppTag(context: RequestContext): Promise<boolean> {
    return Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
  },
  async deleteAppTag(parent: AppTag, context: RequestContext): Promise<boolean> {
    if (isAdminOrServiceUser(context)) {
      return true;
    }
    const app = await context.batched.App.get(AppPK.parse(parent.app));
    return isCurrentUserPK(app.owner, context);
  },
};
