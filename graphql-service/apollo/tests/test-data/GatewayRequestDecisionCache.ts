import { RequestContext } from "@/src/RequestContext";
import { GatewayRequestDecisionCacheCreateProps } from "@/src/database/models/GatewayRequestDecisionCache";
import { AppPK } from "@/src/pks/AppPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { UserPK } from "@/src/pks/UserPK";
import { createTestApp } from "tests/test-data/App";
import { createTestPricing } from "tests/test-data/Pricing";
import { createTestUser } from "tests/test-data/User";

export async function createTestGatewayRequestDecisionCache(
  context: RequestContext,
  overwrites?: Partial<GatewayRequestDecisionCacheCreateProps>
) {
  const { requester, app, pricing, nextForcedBalanceCheckRequestCount, nextForcedBalanceCheckTime } = overwrites ?? {};
  return context.batched.GatewayRequestDecisionCache.create({
    requester: requester ?? UserPK.stringify(await createTestUser(context)),
    app: app ?? AppPK.stringify(await createTestApp(context)),
    pricing: pricing ?? PricingPK.stringify(await createTestPricing(context)),
    nextForcedBalanceCheckRequestCount: nextForcedBalanceCheckRequestCount ?? 0,
    nextForcedBalanceCheckTime: nextForcedBalanceCheckTime ?? 0,
  });
}
