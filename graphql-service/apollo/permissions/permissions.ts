import { RequestContext } from "../RequestContext";

import { Endpoint } from "@/database/models/Endpoint";
import { AppPK } from "../pks/AppPK";
import { UserPK } from "../pks/UserPK";
import { isAdminOrServiceUser } from "./utils";

export const OtherPermissions = {
  async settleUserAccountActivities(context: RequestContext): Promise<boolean> {
    return Promise.resolve(context.isSQSMessage && context.isServiceRequest);
  },
  async triggerBilling(context: RequestContext): Promise<boolean> {
    return Promise.resolve(context.isServiceRequest);
  },
  async _sqsTriggerBilling(context: RequestContext): Promise<boolean> {
    return Promise.resolve(context.isServiceRequest);
  },
  async viewPrivateEndpointArributes(parent: Endpoint, context: RequestContext): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    if (!context.currentUser) {
      return false;
    }
    const app = await context.batched.App.get(AppPK.parse(parent.app));
    return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
  },
  async flushAppSearchIndex(context: RequestContext): Promise<boolean> {
    return Promise.resolve(isAdminOrServiceUser(context));
  },
};
