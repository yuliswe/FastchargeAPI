import { RequestContext } from "../RequestContext";
import { User } from "../dynamoose/models";
import { UserPK } from "../pks/UserPK";
import { MD5 } from "object-hash";
export async function getUserByPK(context: RequestContext, pk: string) {
    return context.batched.User.get(UserPK.parse(pk));
}

export function createUserIDFromEmail(email: string) {
    return `user_${MD5(email)}`;
}

export async function createUserWithEmail(context: RequestContext, email: string): Promise<User> {
    let user = await context.batched.User.create({
        id: createUserIDFromEmail(email),
        email: email,
    });
    return user;
}
