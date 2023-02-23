import { RequestContext } from "../RequestContext";
import { App, User } from "../dynamoose/models";

export async function getAppAuthorUser(
    context: RequestContext,
    app: App
): Promise<User> {
    let appAuthor = await context.batched.User.get({ email: app.owner });
    return appAuthor;
}
