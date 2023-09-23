import { AppTag } from "@/database/models/AppTag";
import { RequestContext } from "../RequestContext";
import { AppPK } from "../pks/AppPK";
import { isAdminOrServiceUser, isCurrentUserPK } from "./utils";

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
