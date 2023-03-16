import { GQLResolvers, GQLUserAppTokenResolvers } from "../__generated__/resolvers-types";
import { UserAppTokenModel } from "../dynamoose/models";
import { UserPK } from "../pks/UserPK";
import { AppPK } from "../pks/AppPK";

export const userAppTokenResolvers: GQLResolvers & {
    UserAppToken: Required<GQLUserAppTokenResolvers>;
} = {
    UserAppToken: {
        __isTypeOf: (parent) => parent instanceof UserAppTokenModel,
        createdAt: (parent) => parent.createdAt,
        updatedAt: (parent) => parent.updatedAt,
        signature: (parent) => parent.signature,
        app: (parent, args: {}, context) => context.batched.App.get(AppPK.parse(parent.app)),
        subscriber: (parent, args: {}, context) => context.batched.User.get(UserPK.parse(parent.subscriber)),
        token: (parent) => parent.token,

        async deleteUserAppToken(parent, args, context) {
            await context.batched.UserAppToken.delete(parent);
            return parent;
        },
    },
    Query: {},
    Mutation: {},
};
