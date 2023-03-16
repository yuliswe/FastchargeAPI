import { GraphQLResolveInfo } from "graphql";
import { AccountActivity, User, UserAppToken, UserModel } from "../dynamoose/models";
import { AlreadyExists, Denied, TooManyResources } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLAppIndex,
    GQLMutationCreateUserArgs,
    GQLQueryUserArgs,
    GQLResolvers,
    GQLUserAccountActivitiesArgs,
    GQLUserAppToken,
    GQLUserCreateAppTokenArgs,
    GQLUserResolvers,
    GQLUserStripePaymentAcceptArgs,
    GQLUserUpdateUserArgs,
    GQLUserUsageLogsArgs,
    GQLUserUsageSummariesArgs,
} from "../__generated__/resolvers-types";
import { UserPK } from "../pks/UserPK";
import { getUserBalance, settleAccountActivities } from "../functions/account";
import { makeAppTokenForUser } from "../functions/token";
import { AppPK } from "../pks/AppPK";

export const userResolvers: GQLResolvers & {
    User: Required<GQLUserResolvers>;
} = {
    User: {
        __isTypeOf: (parent) => parent instanceof UserModel,
        async email(parent, args, context, info) {
            if (!(await Can.viewUser(parent, context))) {
                throw new Denied();
            }
            return parent.email;
        },
        async apps(parent: User, args: {}, context: RequestContext, info: GraphQLResolveInfo) {
            let apps = await context.batched.App.many(
                { owner: parent.email },
                {
                    using: GQLAppIndex.IndexByOwnerOnlyPk,
                }
            );
            let visableApps = await Can.viewAppFilter(apps, context);
            return visableApps;
        },
        async subscriptions(parent: User, args: {}, context: RequestContext, info: GraphQLResolveInfo) {
            return await context.batched.Subscription.many({
                subscriber: parent.email,
            });
        },
        author: (parent) => parent.author || "",
        async balance(parent, args, context) {
            return await getUserBalance(context, UserPK.stringify(parent));
        },
        createdAt: (parent) => parent.createdAt,
        updatedAt: (parent) => parent.updatedAt,
        stripeCustomerId: (parent) => parent.stripeCustomerId,
        stripeConnectAccountId: (parent) => parent.stripeConnectAccountId,
        balanceLimit: (parent) => parent.balanceLimit,
        async appToken(parent, { app }, context) {
            return await context.batched.UserAppToken.get({ subscriber: parent.email, app });
        },
        async stripePaymentAccept(parent, { stripeSessionId }: GQLUserStripePaymentAcceptArgs, context) {
            return await context.batched.StripePaymentAccept.get({ user: parent.email, stripeSessionId });
        },
        async accountActivities(parent: User, { limit, dateRange }: GQLUserAccountActivitiesArgs, context) {
            let result = await context.batched.AccountActivity.many(
                {
                    user: UserPK.stringify(parent),
                    createdAt: dateRange
                        ? {
                              le: dateRange.end,
                              ge: dateRange.start,
                          }
                        : undefined,
                },
                {
                    limit,
                    sort: "descending",
                }
            );
            return result;
        },
        async accountHistories(parent: User, { limit, dateRange }: GQLUserAccountActivitiesArgs, context) {
            let result = await context.batched.AccountHistory.many(
                {
                    user: UserPK.stringify(parent),
                    closingTime: dateRange
                        ? {
                              le: dateRange.end,
                              ge: dateRange.start,
                          }
                        : undefined,
                },
                {
                    limit,
                    sort: "descending",
                }
            );
            return result;
        },
        async updateUser(
            parent: User,
            { author, stripeCustomerId, stripeConnectAccountId }: GQLUserUpdateUserArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<User> {
            if (!(await Can.updateUser(parent, context))) {
                throw new Denied();
            }
            let user = await context.batched.User.update(parent, {
                author,
                stripeCustomerId,
                stripeConnectAccountId,
            });
            return user;
        },

        async usageLogs(parent: User, args: GQLUserUsageLogsArgs, context, info) {
            let { app, path, limit, dateRange } = args;
            let usage = await context.batched.UsageLog.many(
                {
                    subscriber: parent.email,
                    app: app,
                    path,
                    createdAt: dateRange
                        ? {
                              le: dateRange.end,
                              ge: dateRange.start,
                          }
                        : undefined,
                },
                {
                    limit: Math.min(limit || 1000, 1000),
                }
            );
            return usage;
        },

        async usageSummaries(parent: User, { limit, app, dateRange }: GQLUserUsageSummariesArgs, context, info) {
            let usageSummaries = await context.batched.UsageSummary.many(
                {
                    subscriber: parent.email,
                    app,
                    createdAt: dateRange
                        ? {
                              le: dateRange.end,
                              ge: dateRange.start,
                          }
                        : undefined,
                },
                {
                    limit: Math.min(limit || 1000, 1000),
                    sort: "descending",
                }
            );
            return usageSummaries;
        },

        /**
         * settleAccountActivities should only be called from the billing queue.
         */
        async settleAccountActivities(parent: User, args: {}, context: RequestContext): Promise<AccountActivity[]> {
            let result = await settleAccountActivities(context, UserPK.stringify(parent));
            if (result === null) {
                return [];
            }
            return result.affectedAccountActivities;
        },

        async createAppToken(
            parent: User,
            { app }: GQLUserCreateAppTokenArgs,
            context: RequestContext
        ): Promise<UserAppToken> {
            await context.batched.App.get(AppPK.parse(app)); // check that the app exists
            let { token: tokenString, signature } = await makeAppTokenForUser(context, {
                user: UserPK.stringify(parent),
                app,
            });
            let existing = await context.batched.UserAppToken.getOrNull({
                subscriber: UserPK.stringify(parent),
                app,
            });
            if (existing) {
                throw new TooManyResources("A token already exists for this user and app.");
            }
            let token = await context.batched.UserAppToken.create({
                subscriber: UserPK.stringify(parent),
                app,
                signature,
            });
            token.token = tokenString; // Do not store the token string in the database.
            return token;
        },
    },
    Query: {
        async users(parent: {}, args: {}, context: RequestContext, info: GraphQLResolveInfo): Promise<User[]> {
            if (!(await Can.listUsers(context))) {
                throw new Denied();
            }
            let users = await context.batched.User.scan();
            return users;
        },
        async user(parent: {}, { email }: GQLQueryUserArgs, context: RequestContext, info: GraphQLResolveInfo) {
            let user = await context.batched.User.get({ email });
            if (!(await Can.viewUser(user, context))) {
                throw new Denied();
            }
            return user;
        },
    },
    Mutation: {
        async createUser(
            parent: {},
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
