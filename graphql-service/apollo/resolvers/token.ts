import { GQLResolvers, GQLUserAppTokenResolvers } from "../__generated__/resolvers-types";
import { UserAppToken, UserAppTokenModel } from "../dynamoose/models";
import { UserPK } from "../pks/UserPK";
import { AppPK } from "../pks/AppPK";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
/**
 * Make is so that only the owner can read the private attributes.
 */
function makePrivate<T>(
    getter: (parent: UserAppToken, args: {}, context: RequestContext) => T
): (parent: UserAppToken, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: UserAppToken, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewUserAppTokenPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const userAppTokenResolvers: GQLResolvers & {
    UserAppToken: Required<GQLUserAppTokenResolvers>;
} = {
    UserAppToken: {
        __isTypeOf: (parent) => parent instanceof UserAppTokenModel,
        createdAt: makePrivate((parent) => parent.createdAt),
        updatedAt: makePrivate((parent) => parent.updatedAt),
        signature: makePrivate((parent) => parent.signature),
        app: makePrivate((parent, args: {}, context) => context.batched.App.get(AppPK.parse(parent.app))),
        subscriber: makePrivate((parent, args: {}, context) =>
            context.batched.User.get(UserPK.parse(parent.subscriber))
        ),
        token: makePrivate((parent) => parent.token),

        async deleteUserAppToken(parent, args, context) {
            if (!(await Can.deleteUserAppToken(parent, context))) {
                throw new Denied();
            }
            return await context.batched.UserAppToken.delete(parent);
        },
    },
    Query: {},
    Mutation: {},
};
