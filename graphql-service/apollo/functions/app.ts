import { RequestContext } from "../RequestContext";
import { App } from "../dynamoose/models";
import { AppPK } from "../pks/AppPK";

export async function getAppByPK(context: RequestContext, pk: string): Promise<App> {
    return context.batched.App.get(AppPK.parse(pk));
}

export function isValidAppName(name: string): boolean {
    let reserved = ["api", "login", "auth"];
    return /^[a-z\d][a-z\d\\-]*[a-z\d]$/.test(name) && name.length <= 63 && !reserved.includes(name);
}
