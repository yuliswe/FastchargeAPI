import { GQLAppTagUpdateAppTagArgs } from "@/__generated__/resolvers-types";
import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";
import { AppTag } from "../database/models";
import { AppPK } from "../pks/AppPK";

export const AppTagPermissions = {
    async createAppTag(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
    },
    async updateAppTag(parent: AppTag, { tag }: GQLAppTagUpdateAppTagArgs, context: RequestContext): Promise<boolean> {
        if (tag === "Featured" || tag === "Latest") {
            return Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
};
