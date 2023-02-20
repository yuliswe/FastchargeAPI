import { User } from "../dynamoose/models";

export class UserPK {
    static parse(pk: string): { email: string } {
        return {
            email: pk,
        };
    }

    static stringify(item: User): string {
        return item.email;
    }
}
