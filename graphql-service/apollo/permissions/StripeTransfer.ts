import { StripeTransfer } from "@/database/models/StripeTransfer";
import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";

export const StripeTransferPermissions = {
    async viewStripeTransferPrivateAttributes(parent: StripeTransfer, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.receiver === UserPK.stringify(context.currentUser));
    },
    async viewStripeTransfer(parent: StripeTransfer, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.receiver === UserPK.stringify(context.currentUser));
    },
    async createStripeTransfer(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isSQSMessage && context.isServiceRequest);
    },
};
