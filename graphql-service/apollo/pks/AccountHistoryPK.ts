import { AccountHistory } from "../dynamoose/models";

export class AccountHistoryPK {
    static parse(pk: string): { user: string; startingTime: number } {
        let [user, startingTime] = JSON.parse(Buffer.from(pk.replace(/^acch_/, ""), "base64url").toString("utf8"));
        return {
            user,
            startingTime,
        };
    }

    static stringify(item: AccountHistory): string {
        return "acch_" + Buffer.from(JSON.stringify([item.user, item.startingTime])).toString("base64url");
    }
}
