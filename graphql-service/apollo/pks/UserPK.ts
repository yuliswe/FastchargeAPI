import type { User } from "../dynamoose/models";

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

    static isAdmin(user: User): boolean {
        return user.email === "fastchargeapi@gmail.com" || user.email === "devfastchargeapi@gmail.com";
    }
}
