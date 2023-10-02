import { StripeTransfer } from "@/database/models/StripeTransfer";
import { PK } from "@/database/utils";
import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";
import { isAdminOrServiceUser, isCurrentUserPK } from "./utils";

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
    async createStripeTransfer({ receiver }: { receiver: PK }, context: RequestContext): Promise<boolean> {
        return Promise.resolve(isAdminOrServiceUser(context) || isCurrentUserPK(receiver, context));
    },
    async getStripeTransfer(parent: StripeTransfer, context: RequestContext): Promise<boolean> {
        return Promise.resolve(isCurrentUserPK(parent.receiver, context) || isAdminOrServiceUser(context));
    },
};
