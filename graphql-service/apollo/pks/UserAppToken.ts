import { PK } from "@/database/utils";

export type UserAppTokenPKContent = {
    subscriber: string;
    createdAt: number;
};

export class UserAppTokenPK {
    static parse(pk: PK): UserAppTokenPKContent {
        const [subscriber, createdAt] = JSON.parse(
            Buffer.from(pk.replace(/^usrapptkn_/, ""), "base64url").toString("utf8")
        ) as [string, number];
        return {
            subscriber,
            createdAt,
        };
    }

    static stringify({ subscriber, createdAt }: UserAppTokenPKContent): PK {
        return "usrapptkn_" + Buffer.from(JSON.stringify([subscriber, createdAt])).toString("base64url");
    }
}
