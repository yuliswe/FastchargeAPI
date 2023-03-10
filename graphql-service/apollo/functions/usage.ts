import { Item } from "dynamoose/dist/Item";
import { RequestContext } from "../RequestContext";
import { UsageLog, UsageSummary } from "../dynamoose/models";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { Chalk } from "chalk";

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
    }: {
        user: string;
        app: string;
    }
): Promise<{ affectedUsageSummaries: UsageSummary[] }> {
    let usageLogs = await context.batched.UsageLog.many({
        subscriber: user,
        app,
        status: "pending",
    });
    if (usageLogs.length === 0) {
        return {
            affectedUsageSummaries: [],
        };
    }
    // These usage logs could be subscribed to different pricings. We need to
    // group them by pricing.
    let usageLogsByPricing = new Map<string, UsageLog[]>();
    for (let usage of usageLogs) {
        let pricing = usage.pricing;
        let logs = usageLogsByPricing.get(pricing);
        if (logs == undefined) {
            logs = [];
            usageLogsByPricing.set(pricing, logs);
        }
        logs.push(usage);
    }

    let summaryPromises = [...usageLogsByPricing.entries()].map(async ([pricingPK, usageLogs]) => {
        let summary = {
            subscriber: user,
            app: app,
            numberOfLogs: usageLogs.length,
            volume: 0,
            pricing: pricingPK,
        };
        for (let usage of usageLogs) {
            summary.volume += usage.volume;
        }
        let usageSummary = await context.batched.UsageSummary.create(summary);
        let promises: Promise<Item>[] = [];
        for (let usage of usageLogs) {
            usage.usageSummary = UsageSummaryPK.stringify(usageSummary);
            usage.status = "collected";
            usage.collectedAt = usageSummary.createdAt;
            promises.push(usage.save());
        }
        await Promise.all(promises);
        return usageSummary;
    });
    let affectedUsageSummaries = await Promise.all(summaryPromises);
    return { affectedUsageSummaries };
}
