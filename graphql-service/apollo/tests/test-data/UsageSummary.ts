import { RequestContext } from "@/src/RequestContext";
import { UsageSummaryStatus } from "@/src/__generated__/resolvers-types";
import { UsageSummaryCreateProps } from "@/src/database/models/UsageSummary";
import { PricingPK } from "@/src/pks/PricingPK";
import { UserPK } from "@/src/pks/UserPK";
import { createTestPricing } from "tests/test-data/Pricing";
import { createTestUser } from "tests/test-data/User";

export async function createTestUsageSummary(context: RequestContext, overwrites?: Partial<UsageSummaryCreateProps>) {
  const pricing =
    (overwrites?.pricing && (await context.batched.Pricing.get(PricingPK.parse(overwrites.pricing)))) ||
    (await createTestPricing(context, { app: overwrites?.app }));
  return context.batched.UsageSummary.create({
    subscriber: overwrites?.subscriber ?? UserPK.stringify(await createTestUser(context)),
    app: overwrites?.app ?? pricing.app,
    pricing: overwrites?.pricing ?? PricingPK.stringify(pricing),
    status: UsageSummaryStatus.Pending,
    billedAt: undefined,
    volume: 1,
    billingRequestChargeAccountActivity: undefined,
    numberOfLogs: 1,
    ...overwrites,
  });
}
