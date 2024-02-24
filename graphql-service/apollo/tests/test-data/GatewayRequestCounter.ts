import { RequestContext } from "@/src/RequestContext";
import { GatewayRequestCounterCreateProps } from "@/src/database/models/GatewayRequestCounter";
import { UserPK } from "@/src/pks/UserPK";
import { createTestUser } from "tests/test-data/User";

export async function createTestGatewayRequestCounter(
  context: RequestContext,
  overwrites?: Partial<GatewayRequestCounterCreateProps>
) {
  const { requester, app, counterSinceLastReset } = overwrites ?? {};
  return context.batched.GatewayRequestCounter.create({
    requester: requester ?? UserPK.stringify(await createTestUser(context)),
    app: app ?? "<global>",
    isGlobalCounter: true,
    counterSinceLastReset: counterSinceLastReset ?? 0,
  });
}
