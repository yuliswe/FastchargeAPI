import { GraphQLResolveInfo } from "graphql";
import { AppModel, User, UserModel } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateUserArgs,
    GQLQueryUserArgs,
    GQLResolvers,
    GQLUser,
    GQLUserResolvers,
    GQLUserUpdateUserArgs,
    GQLUserUsageLogsArgs,
} from "../__generated__/resolvers-types";

export const userResolvers: GQLResolvers & {
    User: Required<GQLUserResolvers>;
} = {
    User: {
        __isTypeOf: (parent) => parent instanceof UserModel,
        async email(parent, args, context, info) {
            let user = await context.batched.User.get(parent.email);
            if (!(await Can.viewUser(user, context))) {
                throw new Denied();
            }
            return user.email;
        },
        async apps(
            parent: User,
            args: never,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            let apps = await context.batched.App.many({ owner: parent.email });
            let visableApps = await Can.viewAppFilter(apps, context);
            return visableApps;
        },
        async subscriptions(
            parent: User,
            args: never,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            return await context.batched.Subscribe.many({
                subscriber: parent.email,
            });
        },
        author: (parent) => parent.author || "",
        balance: (parent) => parent.balance || "0",
        stripeCustomerId: (parent) => parent.stripeCustomerId,
        stripeConnectAccountId: (parent) => parent.stripeConnectAccountId,

        async updateUser(
            parent: GQLUser,
            { stripeCustomerId, stripeConnectAccountId }: GQLUserUpdateUserArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<User> {
            if (!(await Can.updateUser(parent, context))) {
                throw new Denied();
            }
            let user = await context.batched.User.update(parent, {
                stripeCustomerId,
                stripeConnectAccountId,
            });
            return user;
        },

        async usageLogs(
            parent: User,
            args: GQLUserUsageLogsArgs,
            context,
            info
        ) {
            let { app, path, limit, start } = args;
            let usage = await context.batched.UsageLog.many(
                {
                    subscriber: parent.email,
                    app,
                },
                {
                    limit,
                }
            );
            return usage;
        },
    },
    Query: {
        async users(
            parent: never,
            args: never,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<User[]> {
            if (!(await Can.listUsers(context))) {
                throw new Denied();
            }
            let users = await context.batched.User.scan();
            return users;
        },
        async user(
            parent: never,
            args: GQLQueryUserArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            let user = await context.batched.User.get(args.email);
            if (!(await Can.viewUser(user, context))) {
                throw new Denied();
            }
            return user;
        },
    },
    Mutation: {
        async createUser(
            parent: never,
            { email }: GQLMutationCreateUserArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<User> {
            if (!(await Can.createUser({ email }, context))) {
                throw new Denied();
            }
            let user = await context.batched.User.create({
                email,
            });
            return user;
        },
    },
};
