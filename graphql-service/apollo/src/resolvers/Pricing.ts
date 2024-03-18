import { RequestContext } from "@/src/RequestContext";
import {
  GQLMutationCreatePricingArgs,
  GQLPricingUpdatePricingArgs,
  GQLQueryGetPricingArgs,
  GQLQueryListPricingsByAppArgs,
  GQLResolvers,
  PricingAvailability,
} from "@/src/__generated__/resolvers-types";
import { Pricing } from "@/src/database/models/Pricing";
import { BadInput, Denied, ImmutableResource, TooManyResources } from "@/src/errors";
import { Can } from "@/src/permissions";
import { AppPK } from "@/src/pks/AppPK";
import "@/src/pks/PricingPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { UserPK } from "@/src/pks/UserPK";

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
      if (parent.availability != PricingAvailability.Public) {
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
      { name, minMonthlyCharge, chargePerRequest, callToAction, freeQuota, availability }: GQLPricingUpdatePricingArgs,
      context: RequestContext
    ): Promise<Pricing> {
      if (
        (minMonthlyCharge && minMonthlyCharge !== parent.minMonthlyCharge) ||
        (chargePerRequest && chargePerRequest !== parent.minMonthlyCharge) ||
        (freeQuota && freeQuota !== parent.freeQuota)
      ) {
        throw new ImmutableResource("Pricing", "Cannot update minMonthlyCharge, chargePerRequest, or freeQuota.");
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
        name: name ?? undefined,
        minMonthlyCharge: minMonthlyCharge ?? undefined,
        chargePerRequest: chargePerRequest ?? undefined,
        callToAction: callToAction ?? undefined,
        freeQuota: freeQuota ?? undefined,
        minMonthlyChargeFloat: minMonthlyCharge ? Number.parseFloat(minMonthlyCharge) : undefined,
        chargePerRequestFloat: chargePerRequest ? Number.parseFloat(chargePerRequest) : undefined,
        availability: availability ?? undefined,
      });
    },
  },
  Query: {
    async getPricing(parent: {}, { pk }: GQLQueryGetPricingArgs, context: RequestContext) {
      if (!pk) {
        throw new BadInput("pk is required");
      }
      return await context.batched.Pricing.get(PricingPK.parse(pk));
    },
    async listPricingsByApp(parent: {}, { app }: GQLQueryListPricingsByAppArgs, context: RequestContext) {
      const appObj = await context.batched.App.get(AppPK.parse(app));
      if (await Can.viewAppHiddenPricingPlans(appObj, context)) {
        return await context.batched.Pricing.many({
          app: AppPK.guard(app),
        });
      } else {
        const plans = await context.batched.Pricing.many({
          app: AppPK.guard(app),
          availability: PricingAvailability.Public,
        });
        // Regular users can only see public pricing plans, and the plan
        // thay are already subscribed to.
        if (context.currentUser) {
          const userSub = await context.batched.Subscription.getOrNull({
            app: AppPK.guard(app),
            subscriber: UserPK.stringify(context.currentUser),
          });
          if (userSub) {
            const currentPlan = await context.batched.Pricing.getOrNull(PricingPK.parse(userSub.pricing));
            if (currentPlan) {
              plans.push(currentPlan);
            }
          }
        }
        return plans;
      }
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
        callToAction: callToAction ?? undefined,
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