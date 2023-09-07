import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreatePricingArgs,
    GQLPricingAvailability,
    GQLPricingUpdatePricingArgs,
    GQLQueryPricingArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { Pricing } from "../database/models";
import { BadInput, Denied, ImmutableResource, TooManyResources } from "../errors";
import { Can } from "../permissions";
import { AppPK } from "../pks/AppPK";
import "../pks/PricingPK";
import { PricingPK } from "../pks/PricingPK";

/**
 * If the pricing is invisible, only the owner can read attributes. Otherwise,
 * the attributes are readable by everyone.
 */
function makeOwnerReadableWhenInvisible<T>(
    getter: (parent: Pricing, args: {}, context: RequestContext) => T
): (parent: Pricing, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: Pricing, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewPricingInvisiableAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}
export const PricingResolvers: GQLResolvers = {
    Pricing: {
        pk: makeOwnerReadableWhenInvisible((parent) => PricingPK.stringify(parent)),
        async app(parent, args, context, info) {
            if (parent.availability != GQLPricingAvailability.Public) {
                if (!(await Can.viewPricingInvisiableAttributes(parent, context))) {
                    throw new Denied();
                }
            }
            const app = await context.batched.App.get(AppPK.parse(parent.app));
            return app;
        },
        name: makeOwnerReadableWhenInvisible((parent) => parent.name),
        minMonthlyCharge: makeOwnerReadableWhenInvisible((parent) => parent.minMonthlyCharge),
        chargePerRequest: makeOwnerReadableWhenInvisible((parent) => parent.chargePerRequest),
        callToAction: makeOwnerReadableWhenInvisible((parent) => parent.callToAction),
        freeQuota: makeOwnerReadableWhenInvisible((parent) => parent.freeQuota),
        availability: makeOwnerReadableWhenInvisible((parent) => parent.availability),
        createdAt: makeOwnerReadableWhenInvisible((parent) => parent.createdAt),
        updatedAt: makeOwnerReadableWhenInvisible((parent) => parent.updatedAt),

        async deletePricing(parent: Pricing, args: {}, context, info) {
            if (!(await Can.deletePricing(parent, context))) {
                throw new Denied();
            }
            await context.batched.Pricing.delete(parent);
            return parent;
        },

        async updatePricing(
            parent: Pricing,
            {
                name,
                minMonthlyCharge,
                chargePerRequest,
                callToAction,
                freeQuota,
                availability,
            }: GQLPricingUpdatePricingArgs,
            context: RequestContext
        ): Promise<Pricing> {
            if (
                (minMonthlyCharge && minMonthlyCharge !== parent.minMonthlyCharge) ||
                (chargePerRequest && chargePerRequest !== parent.minMonthlyCharge) ||
                (freeQuota && freeQuota !== parent.freeQuota)
            ) {
                throw new ImmutableResource(
                    "Pricing",
                    "Cannot update minMonthlyCharge, chargePerRequest, or freeQuota."
                );
            }
            if (
                !(await Can.updatePricing(parent, context, {
                    minMonthlyCharge,
                    chargePerRequest,
                    freeQuota,
                }))
            ) {
                throw new Denied();
            }
            return await context.batched.Pricing.update(parent, {
                name,
                minMonthlyCharge,
                chargePerRequest,
                callToAction,
                freeQuota,
                minMonthlyChargeFloat: minMonthlyCharge ? Number.parseFloat(minMonthlyCharge) : undefined,
                chargePerRequestFloat: chargePerRequest ? Number.parseFloat(chargePerRequest) : undefined,
                availability,
            });
        },
    },
    Query: {
        async getPricing(parent: {}, { pk }: GQLQueryPricingArgs, context: RequestContext) {
            if (!pk) {
                throw new BadInput("pk is required");
            }
            return await context.batched.Pricing.get(PricingPK.parse(pk));
        },
    },
    Mutation: {
        async createPricing(
            parent: {},
            {
                app,
                callToAction,
                chargePerRequest,
                minMonthlyCharge,
                name,
                availability,
                freeQuota,
            }: GQLMutationCreatePricingArgs,
            context
        ) {
            if (!(await Can.createPricing({ app }, context))) {
                throw new Denied();
            }
            const existingCount = await context.batched.Pricing.count({
                app,
            });
            if (existingCount >= 100) {
                throw new TooManyResources("Too many pricings for this app");
            }
            // Update these because the client does not provide them.
            const minMonthlyChargeFloat = Number.parseFloat(minMonthlyCharge);
            const chargePerRequestFloat = Number.parseFloat(chargePerRequest);
            const pricing = await context.batched.Pricing.create({
                app,
                callToAction,
                chargePerRequest,
                minMonthlyCharge,
                name,
                availability,
                freeQuota,
                minMonthlyChargeFloat,
                chargePerRequestFloat,
            });
            return pricing;
        },
    },
};

/* Deprecated */
PricingResolvers.Query!.pricing = PricingResolvers.Query!.getPricing;
