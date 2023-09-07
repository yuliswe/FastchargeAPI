export type FreeQuotaUsagePKContent = {
    subscriber: string;
    app: string;
};

export class FreeQuotaUsagePK {
    static parse(pk: string): FreeQuotaUsagePKContent {
        const [subscriber, app] = JSON.parse(Buffer.from(pk.replace(/^frequo_/, ""), "base64url").toString("utf8"));
        return {
            subscriber,
            app,
        };
    }

    static stringify({ subscriber, app }: FreeQuotaUsagePKContent): string {
        return "frequo_" + Buffer.from(JSON.stringify([subscriber, app])).toString("base64url");
    }
}
