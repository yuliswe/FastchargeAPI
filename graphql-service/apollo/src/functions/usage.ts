import { RequestContext } from "@/src/RequestContext";
import { UsageLogStatus } from "@/src/__generated__/resolvers-types";
import { UsageLog } from "@/src/database/models/UsageLog";
import { UsageSummary } from "@/src/database/models/UsageSummary";
import { PK } from "@/src/database/utils";
import { asyncGetAll, settlePromisesInBatches, settlePromisesInBatchesByIterator } from "@/src/functions/promise";
import { UsageSummaryPK } from "@/src/pks/UsageSummaryPK";

/**
 * Create a UsageSummary for the given user's usage logs that are not collected.
 * Does nothing if there are no usage logs.
 * @param context
 * @param user
 * @param maxQueueSize
 * @param maxSecondsInQueue
 * @returns
 */
export async function collectUsageLogs(
  context: RequestContext,
  {
    user,
    app,
  }: {
    user: PK;
    app: PK;
  }
): Promise<{ affectedUsageSummaries: UsageSummary[] }> {
  const usageLogs = await context.batched.UsageLog.many({
    subscriber: user,
    app,
    status: UsageLogStatus.Pending,
  });
  if (usageLogs.length === 0) {
    return {
      affectedUsageSummaries: [],
    };
  }
  // These usage logs could be subscribed to different pricings. We need to
  // group them by pricing.
  const usageLogsByPricing = new Map<string, UsageLog[]>();
  for (const usage of usageLogs) {
    const pricing = usage.pricing;
    let logs = usageLogsByPricing.get(pricing);
    if (logs == undefined) {
      logs = [];
      usageLogsByPricing.set(pricing, logs);
    }
    logs.push(usage);
  }

  const affectedUsageSummaries = await asyncGetAll(
    settlePromisesInBatchesByIterator(usageLogsByPricing.entries(), async ([pricingPK, usageLogs]) => {
      const summary = {
        subscriber: user,
        app,
        numberOfLogs: usageLogs.length,
        volume: 0,
        pricing: pricingPK,
      };
      for (const usage of usageLogs) {
        summary.volume += usage.volume;
      }
      const usageSummary = await context.batched.UsageSummary.create(summary);
      await settlePromisesInBatches(
        usageLogs,
        (usage) =>
          context.batched.UsageLog.update(usage, {
            status: UsageLogStatus.Collected,
            usageSummary: UsageSummaryPK.stringify(usageSummary),
            collectedAt: usageSummary.createdAt,
          }),
        {
          batchSize: 10,
        }
      );
      return usageSummary;
    })
  );

  return { affectedUsageSummaries };
}
