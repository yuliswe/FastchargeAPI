import { UsageLog } from "../database/models";

export type UsageLogPKContent = { subscriber: string; createdAt: number };

export class UsageLogPK {
    static parse(pk: string): UsageLogPKContent {
        const [subscriber, createdAt] = JSON.parse(Buffer.from(pk.replace(/^ulog_/, ""), "base64url").toString("utf8"));
        return {
            subscriber,
            createdAt,
        };
    }

    static stringify(item: UsageLog): string {
        return "ulog_" + Buffer.from(JSON.stringify([item.subscriber, item.createdAt])).toString("base64url");
    }

    static extract(item: UsageLog): UsageLogPKContent {
        return {
            subscriber: item.subscriber,
            createdAt: item.createdAt,
        };
    }
}
