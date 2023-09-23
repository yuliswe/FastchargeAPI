import { StripePaymentAccept } from "@/database/models/StripePaymentAccept";
import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";
import { isCurrentUserPK } from "./utils";

export const StripePaymentAcceptPermissions = {
    async viewStripePaymentAcceptPrivateAttributes(parent: StripePaymentAccept, context: RequestContext) {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.user === UserPK.stringify(context.currentUser));
    },
    async viewStripePaymentAccept(item: StripePaymentAccept, context: RequestContext) {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(isCurrentUserPK(item.user, context));
    },
    async createStripePaymentAccept(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isSQSMessage && context.isServiceRequest);
    },
};
