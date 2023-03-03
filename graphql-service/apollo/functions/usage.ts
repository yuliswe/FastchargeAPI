import { Item } from "dynamoose/dist/Item";
import { RequestContext } from "../RequestContext";
import { UsageSummary } from "../dynamoose/models";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";

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
        maxQueueSize = 1000,
        maxSecondsInQueue = 60 * 60 * 24,
    }: {
        user: string;
        app: string;
        maxQueueSize?: number;
        maxSecondsInQueue?: number;
    }
): Promise<UsageSummary | null> {
    let usageLogs = await context.batched.UsageLog.many({
        subscriber: user,
        app,
        status: "pending",
    });
    if (usageLogs.length === 0) {
        return null;
    }
    let summary = {
        subscriber: user,
        app: app,
        queueSize: usageLogs.length,
        volume: 0,
        maxQueueSize,
        maxSecondsInQueue,
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
}

/**
 * Returns true if maxQueueSize or maxSecondsInQueue has been exceeded.
 * @param user
 * @param context
 * @param maxQueueSize
 * @param maxSecondsInQueue
 * @returns
 */
export async function shouldCollectUsageLogs(
    user: string,
    context: RequestContext,
    maxQueueSize = 1000,
    maxSecondsInQueue: number = 60 * 60 * 24
): Promise<boolean> {
    let lastUsageLog = await context.batched.UsageLog.many(
        {
            subscriber: user,
        },
        {
            sort: "descending",
            limit: 1,
        }
    );
    if (lastUsageLog.length === 0) {
        return false;
    }
    if (lastUsageLog[0].queuePosition > maxQueueSize) {
        return true;
    }
    let firstUsageLog = await context.batched.UsageLog.many(
        {
            subscriber: user,
            createdAt: { lt: Date.now() - 1000 * maxSecondsInQueue },
        },
        { limit: 1, sort: "descending" }
    );
    if (firstUsageLog.length === 0) {
        return false;
    }
    return firstUsageLog[0].usageSummary == null;
}
