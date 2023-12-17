import { RequestContext } from "@/RequestContext";
import { UsageLogStatus } from "@/__generated__/resolvers-types";
import { UsageLogCreateProps } from "@/database/models/UsageLog";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { createTestApp } from "./App";
import { createTestPricing } from "./Pricing";
import { createTestUser } from "./User";

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
