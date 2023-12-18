import { AccountHistory } from "@/database/models/AccountHistory";
import { PK } from "@/database/utils";

export class AccountHistoryPK {
  static parse(pk: PK): { user: string; startingTime: number } {
    const [user, startingTime] = JSON.parse(Buffer.from(pk.replace(/^acch_/, ""), "base64url").toString("utf8")) as [
      string,
      number
    ];
    return {
      user,
      startingTime,
    };
  }

  static stringify(item: AccountHistory): PK {
    return "acch_" + Buffer.from(JSON.stringify([item.user, item.startingTime])).toString("base64url");
  }
}
