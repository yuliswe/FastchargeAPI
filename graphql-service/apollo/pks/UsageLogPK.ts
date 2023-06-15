import { UsageLog } from "../dynamoose/models";

export class UsageLogPK {
    static parse(pk: string): { subscriber: string; createdAt: number } {
        const [subscriber, createdAt] = JSON.parse(Buffer.from(pk.replace(/^ulog_/, ""), "base64url").toString("utf8"));
        return {
            subscriber,
            createdAt,
        };
    }

    static stringify(item: UsageLog): string {
        return "ulog_" + Buffer.from(JSON.stringify([item.subscriber, item.createdAt])).toString("base64url");
    }
}
