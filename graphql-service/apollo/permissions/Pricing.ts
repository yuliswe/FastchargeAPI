import { Pricing } from "@/database/models/Pricing";
import { PK } from "@/database/utils";
import { RequestContext } from "../RequestContext";
import { PricingAvailability } from "../__generated__/gql/graphql";
import { GQLPricingUpdatePricingArgs } from "../__generated__/resolvers-types";
import { AppPK } from "../pks/AppPK";
import { PricingPK } from "../pks/PricingPK";
import { UserPK } from "../pks/UserPK";

export const PricingPermissions = {
    async viewPricingInvisiableAttributes(pricing: Pricing, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(pricing.app));
        const isOwner = await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
        if (isOwner) {
            return true;
        }
        if (pricing.availability === PricingAvailability.Public) {
            return true;
        }
        if (pricing.availability === PricingAvailability.ExistingSubscribers) {
            return await context.batched.Subscription.exists({
                app: pricing.app,
                subscriber: UserPK.stringify(context.currentUser),
                pricing: PricingPK.stringify(pricing),
            });
        }
        return false;
    },
    async createPricing({ app: appPK }: { app: PK }, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(appPK));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async deletePricing(parent: Pricing, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async updatePricing(
        parent: Pricing,
        context: RequestContext,
        { minMonthlyCharge, chargePerRequest, freeQuota }: GQLPricingUpdatePricingArgs
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        // These properties are not allowed to be updated unless by admin
        if (
            (minMonthlyCharge && minMonthlyCharge != parent.minMonthlyCharge) ||
            (chargePerRequest && chargePerRequest != parent.chargePerRequest) ||
            (freeQuota && freeQuota != parent.freeQuota)
        ) {
            return context.isAdminUser ?? false;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
};
