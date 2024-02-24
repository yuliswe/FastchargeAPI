import { RequestContext } from "@/src/RequestContext";
import { StripeTransferStatus } from "@/src/__generated__/gql/graphql";
import { StripeTransfer } from "@/src/database/models/StripeTransfer";
import { UserPK } from "@/src/pks/UserPK";
import { createTestUser } from "@/tests/test-data/User";

export async function createTestStripeTransfer(context: RequestContext, overrides: Partial<StripeTransfer> = {}) {
  const stripeTransfer = await context.batched.StripeTransfer.create({
    status: StripeTransferStatus.PendingTransfer,
    receiver: overrides.receiver ?? UserPK.stringify(await createTestUser(context)),
    withdrawAmount: "100",
    transferAt: Date.now(),
    receiveAmount: "100",
    ...overrides,
  });
  return stripeTransfer;
}
