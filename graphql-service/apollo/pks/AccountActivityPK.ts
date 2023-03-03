export type AccountActivityPKContent = {
    user: string;
    createdAt: number;
};

export class AccountActivityPK {
    static parse(pk: string): AccountActivityPKContent {
        let [user, createdAt] = JSON.parse(
            Buffer.from(pk.replace(/^aact_/, ""), "base64url").toString("utf8")
        );
        return {
            user,
            createdAt,
        };
    }

    static stringify(item: AccountActivityPKContent): string {
        return (
            "aact_" +
            Buffer.from(JSON.stringify([item.user, item.createdAt])).toString(
                "base64url"
            )
        );
    }
}
