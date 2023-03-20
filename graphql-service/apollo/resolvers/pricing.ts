import { Pricing } from "../dynamoose/models";
import { Denied, ImmutableResource, TooManyResources } from "../errors";
import { Can } from "../permissions";
import {
    GQLMutationCreatePricingArgs,
    GQLPricingUpdatePricingArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import "../pks/PricingPK";
import { PricingPK } from "../pks/PricingPK";
import { AppPK } from "../pks/AppPK";
import { RequestContext } from "../RequestContext";

/**
 * If the pricing is invisible, only the owner can read attributes. Otherwise,
 * the attributes are readable by everyone.
 */
function makeOwnerReadableWhenInvisible<T>(
    getter: (parent: Pricing, args: {}, context: RequestContext) => T
): (parent: Pricing, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: Pricing, args: {}, context: RequestContext): Promise<T> => {
        if (!parent.visible) {
            if (!(await Can.viewPricingInvisiableAttributes(parent, context))) {
                throw new Denied();
            }
        }
        return getter(parent, args, context);
    };
}
export const pricingResolvers: GQLResolvers = {
    Pricing: {
        pk: makeOwnerReadableWhenInvisible((parent) => PricingPK.stringify(parent)),
        async app(parent, args, context, info) {
            if (!parent.visible) {
                if (!(await Can.viewPricingInvisiableAttributes(parent, context))) {
                    throw new Denied();
                }
            }
            let app = await context.batched.App.get(AppPK.parse(parent.app));
            return app;
        },
        name: makeOwnerReadableWhenInvisible((parent) => parent.name),
        minMonthlyCharge: makeOwnerReadableWhenInvisible((parent) => parent.minMonthlyCharge),
        chargePerRequest: makeOwnerReadableWhenInvisible((parent) => parent.chargePerRequest),
        callToAction: makeOwnerReadableWhenInvisible((parent) => parent.callToAction),
        freeQuota: makeOwnerReadableWhenInvisible((parent) => parent.freeQuota),
        visible: makeOwnerReadableWhenInvisible((parent) => parent.visible),
        mutable: makeOwnerReadableWhenInvisible((parent) => parent.mutable),
        // activeSubscriberCount: (parent) => parent.activeSubscriberCount,
        async deletePricing(parent: Pricing, args: never, context, info) {
            if (!(await Can.deletePricing(parent, args, context))) {
                throw new Denied();
            }
            if (!parent.mutable) {
                throw new ImmutableResource();
            }
            await context.batched.Pricing.delete(args);
            return parent;
        },

        async updatePricing(
            parent: Pricing,
            { name, minMonthlyCharge, chargePerRequest, callToAction, visible, freeQuota }: GQLPricingUpdatePricingArgs,
            context: RequestContext
        ): Promise<Pricing> {
            if (!(await Can.updatePricing(parent, context))) {
                throw new Denied();
            }
            if (parent.mutable) {
                return await context.batched.Pricing.update(parent, {
                    name,
                    minMonthlyCharge,
                    chargePerRequest,
                    callToAction,
                    visible,
                    freeQuota,
                    mutable: !visible, // Once the pricing becomes visible, it becomes immutable forever.
                    minMonthlyChargeApprox: minMonthlyCharge ? Number.parseFloat(minMonthlyCharge) : undefined,
                    chargePerRequestApprox: chargePerRequest ? Number.parseFloat(chargePerRequest) : undefined,
                });
            } else {
                // Only allow updating selected fields.
                if (minMonthlyCharge != null || chargePerRequest != null || freeQuota != null) {
                    throw new ImmutableResource(
                        "Cannot update minMonthlyCharge, chargePerRequest, or freeQuota once the pricing became visible."
                    );
                } else {
                    return await context.batched.Pricing.update(parent, {
                        name,
                        visible,
                        callToAction,
                    });
                }
            }
        },
    },
    Query: {},
    Mutation: {
        async createPricing(
            parent: {},
            { app, callToAction, chargePerRequest, minMonthlyCharge, name }: GQLMutationCreatePricingArgs,
            context,
            info
        ) {
            if (!(await Can.createPricing({ app }, context))) {
                throw new Denied();
            }
            let existingCount = await context.batched.Pricing.count({
                app,
            });
            if (existingCount > 3) {
                throw new TooManyResources("Too many pricings for this app");
            }
            // Update these because the client does not provide them.
            let minMonthlyChargeApprox = Number.parseFloat(minMonthlyCharge);
            let chargePerRequestApprox = Number.parseFloat(chargePerRequest);
            let pricing = await context.batched.Pricing.create({
                app,
                callToAction,
                chargePerRequest,
                minMonthlyCharge,
                name,
                minMonthlyChargeApprox,
                chargePerRequestApprox,
            });
            return pricing;
        },
    },
};
