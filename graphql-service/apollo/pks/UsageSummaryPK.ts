import { PK } from "@/database/utils";

export type UsageSummaryPKContent = {
  subscriber: string;
  createdAt: number;
};

export class UsageSummaryPK {
  static parse(pk: PK): UsageSummaryPKContent {
    const [subscriber, createdAt] = JSON.parse(Buffer.from(pk.replace(/^usum_/, ""), "base64url").toString("utf8")) as [
      string,
      number
    ];
    return {
      subscriber,
      createdAt,
    };
  }

  static stringify(item: UsageSummaryPKContent): PK {
    return "usum_" + Buffer.from(JSON.stringify([item.subscriber, item.createdAt])).toString("base64url");
  }

  static extract(item: UsageSummaryPKContent): UsageSummaryPKContent {
    return {
      subscriber: item.subscriber,
      createdAt: item.createdAt,
    };
  }
}
