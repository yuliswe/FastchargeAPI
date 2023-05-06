export type PricingPKContent = {
    app: string;
    createdAt: number;
};

export class PricingPK {
    static parse(pk: string): PricingPKContent {
        let [app, createdAt] = JSON.parse(Buffer.from(pk.replace(/^pri_/, ""), "base64url").toString("utf8"));
        return {
            app,
            createdAt,
        };
    }

    static stringify(pricing: PricingPKContent): string {
        return "pri_" + Buffer.from(JSON.stringify([pricing.app, pricing.createdAt])).toString("base64url");
    }
}
