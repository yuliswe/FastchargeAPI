import { RequestContext } from "@/RequestContext";
import { GatewayRequestCounterCreateProps } from "@/database/models/GatewayRequestCounter";
import { UserPK } from "@/pks/UserPK";
import { createTestUser } from "./User";

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
