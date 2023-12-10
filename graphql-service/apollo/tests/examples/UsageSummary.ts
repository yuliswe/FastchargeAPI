import { RequestContext } from "@/RequestContext";
import { UsageSummaryStatus } from "@/__generated__/resolvers-types";
import { UsageSummaryCreateProps } from "@/database/models/UsageSummary";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { createTestPricing } from "./Pricing";
import { createTestUser } from "./User";

export async function createTestUsageSummary(context: RequestContext, overwrites?: Partial<UsageSummaryCreateProps>) {
    const pricing =
        (overwrites?.pricing && (await context.batched.Pricing.get(PricingPK.parse(overwrites?.pricing)))) ||
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
