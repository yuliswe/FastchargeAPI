import { Chalk } from "chalk";
import { Item } from "dynamoose/dist/Item";
import { RequestContext } from "../RequestContext";
import { GQLUsageLogStatus } from "../__generated__/resolvers-types";
import { UsageLog, UsageSummary } from "../database/models";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";

const chalk = new Chalk({ level: 3 });

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
        path,
    }: {
        user: string;
        app: string;
        path: string;
    }
): Promise<{ affectedUsageSummaries: UsageSummary[] }> {
    const usageLogs = await context.batched.UsageLog.many({
        subscriber: user,
        app,
        status: GQLUsageLogStatus.Pending,
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

    const summaryPromises = [...usageLogsByPricing.entries()].map(async ([pricingPK, usageLogs]) => {
        const summary = {
            subscriber: user,
            app: app,
            numberOfLogs: usageLogs.length,
            volume: 0,
            pricing: pricingPK,
            path,
        };
        for (const usage of usageLogs) {
            summary.volume += usage.volume;
        }
        const usageSummary = await context.batched.UsageSummary.create(summary);
        const promises: Promise<Item>[] = [];
        for (const usage of usageLogs) {
            usage.usageSummary = UsageSummaryPK.stringify(usageSummary);
            usage.status = GQLUsageLogStatus.Collected;
            usage.collectedAt = usageSummary.createdAt;
            promises.push(usage.save());
        }
        await Promise.all(promises);
        return usageSummary;
    });
    const affectedUsageSummaries = await Promise.all(summaryPromises);
    return { affectedUsageSummaries };
}
