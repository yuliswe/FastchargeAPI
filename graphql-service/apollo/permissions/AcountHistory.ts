import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";
import { AccountHistory } from "../database/models";

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
};
