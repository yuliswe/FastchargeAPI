import { StripePaymentAccept } from "@/src/database/models/StripePaymentAccept";
import { isAdminOrServiceUser, isCurrentUserPK } from "@/src/permissions/utils";
import { UserPK } from "@/src/pks/UserPK";
import { RequestContext } from "@/src/RequestContext";

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
    return Promise.resolve(isAdminOrServiceUser(context));
  },
  async getStripePaymentAccept(stripePaymentAccept: StripePaymentAccept, context: RequestContext): Promise<boolean> {
    return Promise.resolve(isCurrentUserPK(stripePaymentAccept.user, context) || isAdminOrServiceUser(context));
  },
  async getStripePaymentAcceptByStripeSessionId(
    stripePaymentAccept: StripePaymentAccept,
    context: RequestContext
  ): Promise<boolean> {
    return Promise.resolve(isCurrentUserPK(stripePaymentAccept.user, context) || isAdminOrServiceUser(context));
  },
};
