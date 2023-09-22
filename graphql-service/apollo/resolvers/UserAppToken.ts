import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateUserAppTokenArgs,
    GQLQueryGetUserAppTokenArgs,
    GQLResolvers,
    GQLUserAppTokenResolvers,
} from "../__generated__/resolvers-types";
import { UserAppToken, UserAppTokenModel } from "../database/models";
import { Denied, NotFound, RequirementNotSatisfied, TooManyResources } from "../errors";
import { createUserAppToken } from "../functions/token";
import { Can } from "../permissions";
import { AppPK } from "../pks/AppPK";
import { UserAppTokenPK } from "../pks/UserAppToken";
import { UserPK } from "../pks/UserPK";
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

export const UserAppTokenResolvers: GQLResolvers & {
    UserAppToken: Required<GQLUserAppTokenResolvers>;
} = {
    UserAppToken: {
        __isTypeOf: (parent) => parent instanceof UserAppTokenModel,
        pk: makePrivate((parent) => UserAppTokenPK.stringify(parent)),
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
    Query: {
        async getUserAppToken(parent, args: GQLQueryGetUserAppTokenArgs, context: RequestContext) {
            if (!(await Can.queryUserAppToken(context))) {
                throw new Denied();
            }
            if (args.subscriber && args.app) {
                return await context.batched.UserAppToken.get({
                    subscriber: args.subscriber,
                    app: args.app,
                });
            }
            if (args.pk) {
                return await context.batched.UserAppToken.get(UserAppTokenPK.parse(args.pk));
            }
            throw new NotFound("UserAppToken", args);
        },
    },
    Mutation: {
        async createUserAppToken(
            parent: {},
            { subscriber: userPK, app: appPK }: GQLMutationCreateUserAppTokenArgs,
            context: RequestContext
        ): Promise<UserAppToken> {
            const user = await context.batched.User.get(UserPK.parse(userPK));
            if (!(await Can.createUserAppToken(user, context))) {
                throw new Denied();
            }
            const subscription = await context.batched.Subscription.getOrNull({
                subscriber: userPK,
                app: appPK,
            });
            if (!subscription) {
                throw new RequirementNotSatisfied("You must be subscribed to this app to create a token.");
            }
            const existing = await context.batched.UserAppToken.getOrNull({
                subscriber: userPK,
                app: appPK,
            });
            if (existing) {
                throw new TooManyResources("A token already exists for this user and app.");
            }
            const { userAppToken, token } = await createUserAppToken(context, { user: userPK, app: appPK });
            userAppToken.token = token; // Do not store the token string in the database.
            return userAppToken;
        },
    },
};