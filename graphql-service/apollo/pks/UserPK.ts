import { User } from "../dynamoose/models";

export class UserPK {
    static parse(pk: string): { id: string } {
        return {
            id: pk,
        };
    }

    static stringify(item: User): string {
        return item.id;
    }
}
