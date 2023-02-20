import { RequestContext } from "../RequestContext";
import { UsageLogModel, UsageSummary } from "../dynamoose/models";
import { UsageSummaryPK } from "./UsageSummaryPK";
import dynamoose from "dynamoose";

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
    user: string,
    maxQueueSize = 1000,
    maxSecondsInQueue: number = 60 * 60 * 24
): Promise<UsageSummary | null> {
    // (await dynamoose.logger()).providers.set(console);

    // console.log(
    //     await UsageLogModel.query({
    //         subscriber: user,
    //         status: "pending",
    //     }).exec()
    // );
    let usageLogs = await context.batched.UsageLog.many({
        subscriber: user,
        status: "pending",
    });
    if (usageLogs.length === 0) {
        return null;
    }
    let summary: Partial<UsageSummary> = {
        subscriber: user,
        queueSize: usageLogs.length,
        volume: 0,
        maxQueueSize,
        maxSecondsInQueue,
    };
    for (let usage of usageLogs) {
        summary.volume += usage.volume;
    }
    let usageSummary = await context.batched.UsageSummary.create(summary);
    let promises = [];
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
