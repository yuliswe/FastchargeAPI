import { RequestContext } from "../RequestContext";
import { User } from "../dynamoose/models";
import { UserPK } from "../pks/UserPK";
import { MD5 } from "object-hash";

export async function getUserByPK(context: RequestContext, pk: string) {
    return context.batched.User.get(UserPK.parse(pk));
}

function createUserIDFromEmail(email: string): string {
    return MD5(email);
}

export async function createUserWithEmail(batched: RequestContext["batched"], email: string): Promise<User> {
    let user = await batched.User.create({
        uid: createUserIDFromEmail(email),
        email: email,
    });
    return user;
}
