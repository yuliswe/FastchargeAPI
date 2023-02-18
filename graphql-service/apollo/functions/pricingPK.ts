import { Pricing } from "../dynamoose/models";

export class PricingPK {
    static parse(pk: string): { app: string; createdAt: number } {
        let [app, createdAt] = JSON.parse(
            Buffer.from(pk.replace(/^pri_/, ""), "base64url").toString("utf8")
        );
        return {
            app,
            createdAt,
        };
    }

    static stringify(pricing: Pricing): string {
        return (
            "pri_" +
            Buffer.from(
                JSON.stringify([pricing.app, pricing.createdAt])
            ).toString("base64url")
        );
    }
}
