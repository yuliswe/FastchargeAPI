import { RequestContext } from "../RequestContext";
import { App, User } from "../dynamoose/models";

export async function getAppAuthorUser(context: RequestContext, app: App): Promise<User> {
    let appAuthor = await context.batched.User.get({ email: app.owner });
    return appAuthor;
}

export async function getAppByPK(context: RequestContext, pk: string): Promise<App> {
    return context.batched.App.get(pk);
}

export function isValidAppName(name: string): boolean {
    let reserved = ["api", "login", "auth"];
    return /^[a-z\d][a-z\d\\-]*[a-z\d]$/.test(name) && name.length <= 63 && !reserved.includes(name);
}
