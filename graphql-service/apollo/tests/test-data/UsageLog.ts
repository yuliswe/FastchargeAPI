import { RequestContext } from "@/src/RequestContext";
import { UsageLogStatus } from "@/src/__generated__/resolvers-types";
import { UsageLogCreateProps } from "@/src/database/models/UsageLog";
import { AppPK } from "@/src/pks/AppPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { UserPK } from "@/src/pks/UserPK";
import { createTestApp } from "tests/test-data/App";
import { createTestPricing } from "tests/test-data/Pricing";
import { createTestUser } from "tests/test-data/User";

export async function createTestUsageLog(context: RequestContext, overwrite?: Partial<UsageLogCreateProps>) {
  const app = overwrite?.app ?? AppPK.stringify(await createTestApp(context));
  return context.batched.UsageLog.create({
    subscriber: overwrite?.subscriber ?? UserPK.stringify(await createTestUser(context)),
    app,
    path: "testpath",
    volume: 1,
    pricing: overwrite?.pricing ?? PricingPK.stringify(await createTestPricing(context, { app })),
    status: UsageLogStatus.Pending,
    ...overwrite,
  });
}
