import { PK } from "@/src/database/utils";
import { BadInput } from "@/src/errors";

export type PricingPKContent = {
  app: PK;
  createdAt: number;
};

export class PricingPK {
  static parse(pk: PK): PricingPKContent {
    try {
      const [app, createdAt] = JSON.parse(Buffer.from(pk.replace(/^pri_/, ""), "base64url").toString("utf8")) as [
        string,
        number
      ];
      return {
        app,
        createdAt,
      };
    } catch (e) {
      console.error("Failed to parse PricingPK", pk);
      throw new BadInput(`Not a valid PricingPK: ${pk}}`);
    }
  }

  static stringify(pricing: PricingPKContent): PK {
    return "pri_" + Buffer.from(JSON.stringify([pricing.app, pricing.createdAt])).toString("base64url");
  }
}
