import { PK } from "@/database/utils";

export type PricingPKContent = {
    app: string;
    createdAt: number;
};

export class PricingPK {
    static parse(pk: PK): PricingPKContent {
        const [app, createdAt] = JSON.parse(Buffer.from(pk.replace(/^pri_/, ""), "base64url").toString("utf8")) as [
            string,
            number
        ];
        return {
            app,
            createdAt,
        };
    }

    static stringify(pricing: PricingPKContent): PK {
        return "pri_" + Buffer.from(JSON.stringify([pricing.app, pricing.createdAt])).toString("base64url");
    }
}
