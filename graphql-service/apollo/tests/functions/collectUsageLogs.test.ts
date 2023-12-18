import { collectUsageLogs } from "@/functions/usage";
import { createTestUsageLog } from "../test-data/UsageLog";
import { baseRequestContext as context } from "../test-utils/test-utils";

describe("collectUsageLogs", () => {
  test("With one usage log", async () => {
    const usageLog = await createTestUsageLog(context);
    const { subscriber, app, pricing } = usageLog;
    const { affectedUsageSummaries } = await collectUsageLogs(context, {
      user: subscriber,
      app,
    });
    expect(affectedUsageSummaries).toMatchObject([
      {
        app,
        pricing,
        subscriber,
        status: "pending",
        numberOfLogs: 1,
        volume: 1,
      },
    ]);
  });

  test("With multiple usage log for the same app + pricing + path", async () => {
    const usageLog = await createTestUsageLog(context);
    const { subscriber, app, pricing, path } = usageLog;
    await createTestUsageLog(context, {
      subscriber,
      app,
      pricing,
      path,
    });
    await createTestUsageLog(context, {
      subscriber,
      app,
      pricing,
      path,
    });
    const { affectedUsageSummaries } = await collectUsageLogs(context, {
      user: subscriber,
      app,
    });
    expect(affectedUsageSummaries).toMatchObject([
      {
        app: usageLog.app,
        subscriber,
        pricing,
        status: "pending",
        numberOfLogs: 3,
        volume: 3,
      },
    ]);
  });

  test("With multiple usage log for the same app + different pricing", async () => {
    const usageLog1 = await createTestUsageLog(context);
    const { subscriber, app } = usageLog1;
    await createTestUsageLog(context, {
      subscriber,
      app,
      pricing: usageLog1.pricing,
      path: "/",
    });
    const usageLog2 = await createTestUsageLog(context, {
      subscriber,
      app,
    });
    await createTestUsageLog(context, {
      subscriber,
      app,
      pricing: usageLog2.pricing,
      path: "/",
    });
    const { affectedUsageSummaries } = await collectUsageLogs(context, {
      user: subscriber,
      app,
    });
    expect(affectedUsageSummaries).toMatchObject([
      {
        app,
        subscriber,
        numberOfLogs: 2,
        pricing: usageLog1.pricing,
        status: "pending",
        volume: 2,
      },
      {
        app,
        subscriber,
        numberOfLogs: 2,
        pricing: usageLog2.pricing,
        status: "pending",
        volume: 2,
      },
    ]);
  });
});
