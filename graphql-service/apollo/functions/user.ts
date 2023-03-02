import { RequestContext } from "../RequestContext";
import { UserPK } from "./UserPK";

export async function getUserByPK(context: RequestContext, pk: string) {
    return context.batched.User.get(UserPK.parse(pk));
}