import { Pricing } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import {
    GQLMutationCreatePricingArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import "../functions/PricingPK";
import { PricingPK } from "../functions/PricingPK";

export const pricingResolvers: GQLResolvers = {
    Pricing: {
        pk: (parent) => PricingPK.stringify(parent),
        async app(parent, args, context, info) {
            let app = await context.batched.App.get(parent.app);
            return app;
        },
        name: (parent) => parent.name,
        minMonthlyCharge: (parent) => parent.minMonthlyCharge,
        chargePerRequest: (parent) => parent.chargePerRequest,
        callToAction: (parent) => parent.callToAction,
        freeQuota: (parent) => parent.freeQuota,
        // activeSubscriberCount: (parent) => parent.activeSubscriberCount,
        async deletePricing(parent: Pricing, args: never, context, info) {
            if (!(await Can.deletePricing(parent, args, context))) {
                throw new Denied();
            }
            await context.batched.Pricing.delete(args);
            return parent;
        },
    },
    Query: {},
    Mutation: {
        async createPricing(
            parent: {},
            {
                app,
                callToAction,
                chargePerRequest,
                minMonthlyCharge,
                name,
            }: GQLMutationCreatePricingArgs,
            context,
            info
        ) {
            await context.batched.App.get(app); // checks if app exists
            let existingCount = await context.batched.Pricing.count({
                app,
            });
            if (existingCount > 3) {
                throw new Error("Too many pricings for this app");
            }
            if (
                !(await Can.createPricing(
                    {
                        app,
                    },
                    context
                ))
            ) {
                throw new Denied();
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
