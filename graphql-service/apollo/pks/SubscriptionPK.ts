import { PK } from "@/database/utils";

export type SubscriptionPKContent = {
    app: string;
    subscriber: string;
};

export class SubscriptionPK {
    static parse(pk: PK): SubscriptionPKContent {
        const [app, subscriber] = JSON.parse(
            Buffer.from(pk.replace(/^subs_/, ""), "base64url").toString("utf8")
        ) as string[];
        return {
            app,
            subscriber,
        };
    }

    static stringify(item: SubscriptionPKContent): PK {
        return "subs_" + Buffer.from(JSON.stringify([item.app, item.subscriber])).toString("base64url");
    }
}
