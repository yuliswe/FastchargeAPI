export type UserPKContent = {
    uid: string;
};

export class UserPK {
    static parse(pk: string): UserPKContent {
        const uid = pk.replace(/^user_/, "");
        return {
            uid,
        };
    }

    static stringify(item: UserPKContent): string {
        return "user_" + item.uid;
    }
}
