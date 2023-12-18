import { PK } from "@/database/utils";

export type StripeTransferPKContent = {
  receiver: string;
  createdAt: number;
};

export class StripeTransferPK {
  static parse(pk: PK): StripeTransferPKContent {
    const [receiver, createdAt] = JSON.parse(Buffer.from(pk.replace(/^stran_/, ""), "base64url").toString("utf8")) as [
      string,
      number
    ];
    return {
      receiver,
      createdAt,
    };
  }

  static stringify(item: StripeTransferPKContent): PK {
    return "stran_" + Buffer.from(JSON.stringify([item.receiver, item.createdAt])).toString("base64url");
  }

  static extract(item: StripeTransferPKContent): StripeTransferPKContent {
    return {
      receiver: item.receiver,
      createdAt: item.createdAt,
    };
  }
}
