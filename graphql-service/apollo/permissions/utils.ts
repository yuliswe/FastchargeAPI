import { RequestContext } from "../RequestContext";
import { User } from "../database/models";
import { UserPK } from "../pks/UserPK";

export function isCurrentUser(user: User, context: RequestContext): boolean {
    return context.currentUser != undefined && UserPK.stringify(context.currentUser) === UserPK.stringify(user);
}

export function isCurrentUserPK(userPK: string, context: RequestContext): boolean {
    return context.currentUser != undefined && UserPK.stringify(context.currentUser) === userPK;
}
