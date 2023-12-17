import { RequestContext } from "@/RequestContext";
import { GatewayRequestDecisionCacheCreateProps } from "@/database/models/GatewayRequestDecisionCache";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { createTestApp } from "./App";
import { createTestPricing } from "./Pricing";
import { createTestUser } from "./User";

export async function createTestGatewayRequestDecisionCache(
    context: RequestContext,
    overwrites?: Partial<GatewayRequestDecisionCacheCreateProps>
) {
    const { requester, app, pricing, nextForcedBalanceCheckRequestCount, nextForcedBalanceCheckTime } =
        overwrites ?? {};
    return context.batched.GatewayRequestDecisionCache.create({
        requester: requester ?? UserPK.stringify(await createTestUser(context)),
        app: app ?? AppPK.stringify(await createTestApp(context)),
        pricing: pricing ?? PricingPK.stringify(await createTestPricing(context)),
        nextForcedBalanceCheckRequestCount: nextForcedBalanceCheckRequestCount ?? 0,
        nextForcedBalanceCheckTime: nextForcedBalanceCheckTime ?? 0,
    });
}
