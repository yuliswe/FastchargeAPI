import { User } from "@/src/database/models/User";
import { UserPK } from "@/src/pks/UserPK";
import { RequestContext } from "@/src/RequestContext";

export function isCurrentUser(user: User, context: RequestContext): boolean {
  return context.currentUser != undefined && UserPK.stringify(context.currentUser) === UserPK.stringify(user);
}

export function isCurrentUserPK(userPK: string, context: RequestContext): boolean {
  return context.currentUser != undefined && UserPK.stringify(context.currentUser) === userPK;
}

export function isAdminOrServiceUser(context: RequestContext): boolean {
  return context.isServiceRequest || context.isAdminUser;
}
