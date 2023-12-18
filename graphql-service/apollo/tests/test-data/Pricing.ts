import { RequestContext } from "@/RequestContext";
import { PricingAvailability, PricingCreateProps } from "@/database/models/Pricing";
import { AppPK } from "@/pks/AppPK";
import { createTestApp } from "./App";

export async function createTestPricing(
  context: RequestContext,
  { app, minMonthlyCharge, chargePerRequest, freeQuota, callToAction }: Partial<PricingCreateProps> = {}
) {
  return context.batched.Pricing.create({
    name: "test-pricing",
    app: app ?? AppPK.stringify(await createTestApp(context)),
    availability: PricingAvailability.Public,
    minMonthlyCharge: minMonthlyCharge ?? "10",
    chargePerRequest: chargePerRequest ?? "0.01",
    freeQuota: freeQuota ?? 0,
    callToAction: callToAction ?? "test-call-to-action",
  });
}
