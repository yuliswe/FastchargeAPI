import { AccountHistory } from "../database/models";

export class AccountHistoryPK {
    static parse(pk: string): { user: string; startingTime: number } {
        const [user, startingTime] = JSON.parse(Buffer.from(pk.replace(/^acch_/, ""), "base64url").toString("utf8"));
        return {
            user,
            startingTime,
        };
    }

    static stringify(item: AccountHistory): string {
        return "acch_" + Buffer.from(JSON.stringify([item.user, item.startingTime])).toString("base64url");
    }
}
