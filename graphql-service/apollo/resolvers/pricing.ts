import { Pricing } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import {
    GQLMutationCreatePricingArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";

export const pricingResolvers: GQLResolvers = {
    Pricing: {
        async app(parent, args, context, info) {
            let app = await context.batched.App.get(parent.app);
            return app;
        },
        name: (parent) => parent.name,
        monthlyCharge: (parent) => parent.monthlyCharge,
        chargePerRequest: (parent) => parent.chargePerRequest,
        callToAction: (parent) => parent.callToAction,
        freeQuota: (parent) => parent.freeQuota,
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
            parent: never,
            args: GQLMutationCreatePricingArgs,
            context,
            info
        ) {
            await context.batched.App.get(args.app); // checks if app exists
            if (!(await Can.createPricing(args, context))) {
                throw new Denied();
            }
            // Update these because the client does not provide them.
            let minMonthlyChargeApprox = Number.parseFloat(
                args.minMonthlyCharge
            );
            let chargePerRequestApprox = Number.parseFloat(
                args.chargePerRequest
            );
            let pricing = await context.batched.Pricing.create({
                ...args,
                minMonthlyChargeApprox,
                chargePerRequestApprox,
            });
            return pricing;
        },
    },
};
