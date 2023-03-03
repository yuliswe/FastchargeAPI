import { UsageSummary } from "../dynamoose/models";

export class UsageSummaryPK {
    static parse(pk: string): { subscriber: string; createdAt: number } {
        let [subscriber, createdAt] = JSON.parse(
            Buffer.from(pk.replace(/^usum_/, ""), "base64url").toString("utf8")
        );
        return {
            subscriber,
            createdAt,
        };
    }

    static stringify(item: UsageSummary): string {
        return (
            "usum_" +
            Buffer.from(
                JSON.stringify([item.subscriber, item.createdAt])
            ).toString("base64url")
        );
    }
}
