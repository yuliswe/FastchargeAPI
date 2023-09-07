export type UserAppTokenPKContent = {
    subscriber: string;
    createdAt: number;
};

export class UserAppTokenPK {
    static parse(pk: string): UserAppTokenPKContent {
        const [subscriber, createdAt] = JSON.parse(
            Buffer.from(pk.replace(/^usrapptkn_/, ""), "base64url").toString("utf8")
        );
        return {
            subscriber,
            createdAt,
        };
    }

    static stringify({ subscriber, createdAt }: UserAppTokenPKContent): string {
        return "usrapptkn_" + Buffer.from(JSON.stringify([subscriber, createdAt])).toString("base64url");
    }
}
