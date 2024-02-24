import { PK } from "@/src/database/utils";

export type AccountActivityPKContent = {
  user: string;
  createdAt: number;
};

export class AccountActivityPK {
  static parse(pk: PK): AccountActivityPKContent {
    const [user, createdAt] = JSON.parse(Buffer.from(pk.replace(/^aact_/, ""), "base64url").toString("utf8")) as [
      string,
      number
    ];
    return {
      user,
      createdAt,
    };
  }

  static stringify(item: AccountActivityPKContent): PK {
    return "aact_" + Buffer.from(JSON.stringify([item.user, item.createdAt])).toString("base64url");
  }

  static extract(item: AccountActivityPKContent): AccountActivityPKContent {
    return {
      user: item.user,
      createdAt: item.createdAt,
    };
  }
}
