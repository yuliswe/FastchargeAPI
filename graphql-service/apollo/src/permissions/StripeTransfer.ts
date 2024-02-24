import { StripeTransfer } from "@/src/database/models/StripeTransfer";
import { PK } from "@/src/database/utils";
import { isAdminOrServiceUser, isCurrentUserPK } from "@/src/permissions/utils";
import { UserPK } from "@/src/pks/UserPK";
import { RequestContext } from "@/src/RequestContext";

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
