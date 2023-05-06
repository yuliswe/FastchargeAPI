export type SubscriptionPKContent = {
    app: string;
    subscriber: string;
};

export class SubscriptionPK {
    static parse(pk: string): SubscriptionPKContent {
        let [app, subscriber] = JSON.parse(Buffer.from(pk.replace(/^subs_/, ""), "base64url").toString("utf8"));
        return {
            app,
            subscriber,
        };
    }

    static stringify(item: SubscriptionPKContent): string {
        return "subs_" + Buffer.from(JSON.stringify([item.app, item.subscriber])).toString("base64url");
    }
}
