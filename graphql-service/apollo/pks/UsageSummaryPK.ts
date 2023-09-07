export type UsageSummaryPKContent = {
    subscriber: string;
    createdAt: number;
};

export class UsageSummaryPK {
    static parse(pk: string): UsageSummaryPKContent {
        const [subscriber, createdAt] = JSON.parse(Buffer.from(pk.replace(/^usum_/, ""), "base64url").toString("utf8"));
        return {
            subscriber,
            createdAt,
        };
    }

    static stringify(item: UsageSummaryPKContent): string {
        return "usum_" + Buffer.from(JSON.stringify([item.subscriber, item.createdAt])).toString("base64url");
    }

    static extract(item: UsageSummaryPKContent): UsageSummaryPKContent {
        return {
            subscriber: item.subscriber,
            createdAt: item.createdAt,
        };
    }
}
