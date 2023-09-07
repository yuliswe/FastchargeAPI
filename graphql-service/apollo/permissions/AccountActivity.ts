import { AccountActivity } from "@/database/models";
import { RequestContext } from "../RequestContext";
import { isCurrentUserPK } from "./utils";

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
};
