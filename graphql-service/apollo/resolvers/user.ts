import { GraphQLResolveInfo } from "graphql";
import { AccountActivity, AppModel, User, UserModel } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateUserArgs,
    GQLQueryUserArgs,
    GQLResolvers,
    GQLUser,
    GQLUserAccountActivitiesArgs,
    GQLUserResolvers,
    GQLUserUpdateUserArgs,
    GQLUserUsageLogsArgs,
    GQLUserUsageSummariesArgs,
} from "../__generated__/resolvers-types";
import { UserPK } from "../pks/UserPK";
import { getUserBalance, settleAccountActivities } from "../functions/account";

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
        async apps(parent: User, args: {}, context: RequestContext, info: GraphQLResolveInfo) {
            let apps = await context.batched.App.many({ owner: parent.email });
            let visableApps = await Can.viewAppFilter(apps, context);
            return visableApps;
        },
        async subscriptions(parent: User, args: {}, context: RequestContext, info: GraphQLResolveInfo) {
            return await context.batched.Subscription.many({
                subscriber: parent.email,
            });
        },
        author: (parent) => parent.author || "",
        balance: async (parent, args, context) => {
            return await getUserBalance(context, UserPK.stringify(parent));
        },
        createdAt: (parent) => parent.createdAt,
        updatedAt: (parent) => parent.updatedAt,
        stripeCustomerId: (parent) => parent.stripeCustomerId,
        stripeConnectAccountId: (parent) => parent.stripeConnectAccountId,
        accountActivities: async (parent: User, { limit, dateRange }: GQLUserAccountActivitiesArgs, context) => {
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
        accountHistories: async (parent: User, { limit, dateRange }: GQLUserAccountActivitiesArgs, context) => {
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
