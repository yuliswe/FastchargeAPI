import { PK } from "@/src/database/utils";

export type FreeQuotaUsagePKContent = {
  subscriber: string;
  app: PK;
};

export class FreeQuotaUsagePK {
  static parse(pk: PK): FreeQuotaUsagePKContent {
    const [subscriber, app] = JSON.parse(Buffer.from(pk.replace(/^frequo_/, ""), "base64url").toString("utf8")) as [
      string,
      string
    ];
    return {
      subscriber,
      app,
    };
  }

  static stringify({ subscriber, app }: FreeQuotaUsagePKContent): PK {
    return "frequo_" + Buffer.from(JSON.stringify([subscriber, app])).toString("base64url");
  }
}
