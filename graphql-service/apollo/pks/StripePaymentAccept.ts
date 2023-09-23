import { PK } from "@/database/utils";

export type StripePaymentAcceptPKContent = {
    user: string;
    createdAt: number;
};

export class StripePaymentAcceptPK {
    static parse(pk: PK): StripePaymentAcceptPKContent {
        const [user, createdAt] = JSON.parse(Buffer.from(pk.replace(/^spaya_/, ""), "base64url").toString("utf8")) as [
            PK,
            number
        ];
        return {
            user,
            createdAt,
        };
    }

    static stringify(item: StripePaymentAcceptPKContent): PK {
        return "spaya_" + Buffer.from(JSON.stringify([item.user, item.createdAt])).toString("base64url");
    }

    static extract(item: StripePaymentAcceptPKContent): StripePaymentAcceptPKContent {
        return {
            user: item.user,
            createdAt: item.createdAt,
        };
    }
}
