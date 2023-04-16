import { Chalk } from "chalk";
import { GraphQLResolveInfo } from "graphql";
import { RequestContext } from "../RequestContext";
import {
    GQLAppIndex,
    GQLMutationCreateUserArgs,
    GQLQueryUserArgs,
    GQLResolvers,
    GQLUserAccountActivitiesArgs,
    GQLUserCreateAppTokenArgs,
    GQLUserGetFastchargeApiIdTokenArgs,
    GQLUserIndex,
    GQLUserResolvers,
    GQLUserStripePaymentAcceptArgs,
    GQLUserUpdateUserArgs,
    GQLUserUsageLogsArgs,
    GQLUserUsageSummariesArgs,
} from "../__generated__/resolvers-types";
import { AccountActivity, App, Subscription, User, UserAppToken, UserModel } from "../dynamoose/models";
import { BadInput, Denied, TooManyResources } from "../errors";
import { getUserBalance, settleAccountActivities } from "../functions/account";
import { createUserAppToken } from "../functions/token";
import { createUserWithEmail, makeFastchargeAPIIdTokenForUser } from "../functions/user";
import { Can } from "../permissions";
import { UserPK } from "../pks/UserPK";
const chalk = new Chalk({ level: 3 });

function makePrivate<T>(
    getter: (parent: User, args: {}, context: RequestContext) => T
): (parent: User, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: User, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewUserPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const userResolvers: GQLResolvers & {
    User: Required<GQLUserResolvers>;
} = {
    User: {
        /**************************
         * All public attributes
         **************************/

        __isTypeOf: (parent) => parent instanceof UserModel,
        createdAt: (parent) => parent.createdAt,
        updatedAt: (parent) => parent.updatedAt,
        author: (parent) => parent.author || "", // users name that is visible to everyone.

        /**
         * @returns apps owned by this user. All apps are public information.
         */
        async apps(parent: User, args: {}, context: RequestContext): Promise<App[]> {
            let apps = await context.batched.App.many(
                { owner: UserPK.stringify(parent) },
                {
                    using: GQLAppIndex.IndexByOwnerOnlyPk,
                }
            );
            return apps;
        },

        /**************************
         * All private attributes
         **************************/

        pk: makePrivate((parent) => UserPK.stringify(parent)),
        email: makePrivate((parent) => parent.email),
        stripeCustomerId: makePrivate((parent) => parent.stripeCustomerId),
        stripeConnectAccountId: makePrivate((parent) => parent.stripeConnectAccountId),
        balanceLimit: makePrivate((parent) => parent.balanceLimit),

        async subscriptions(parent: User, args: {}, context: RequestContext): Promise<Subscription[]> {
            if (!(await Can.viewUserPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await context.batched.Subscription.many({
                subscriber: UserPK.stringify(parent),
            });
        },

        /**
         * @returns user's account balance.
         */
        async balance(parent, args, context) {
            if (!(await Can.viewUserPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await getUserBalance(context, UserPK.stringify(parent));
        },

        async appToken(parent, { app }, context) {
            if (!(await Can.viewUserPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await context.batched.UserAppToken.get({ subscriber: UserPK.stringify(parent), app });
        },

        async stripePaymentAccept(parent, { stripeSessionId }: GQLUserStripePaymentAcceptArgs, context) {
            if (!(await Can.viewUserPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await context.batched.StripePaymentAccept.get({ user: UserPK.stringify(parent), stripeSessionId });
        },

        async accountActivities(parent: User, { limit, dateRange }: GQLUserAccountActivitiesArgs, context) {
            if (!(await Can.viewUserPrivateAttributes(parent, context))) {
                throw new Denied();
            }
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
            if (!(await Can.viewUserPrivateAttributes(parent, context))) {
                throw new Denied();
            }
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

        async usageLogs(parent: User, args: GQLUserUsageLogsArgs, context, info) {
            if (!(await Can.viewUserPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            let { app, path, limit, dateRange } = args;
            let usage = await context.batched.UsageLog.many(
                {
                    subscriber: UserPK.stringify(parent),
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
            if (!(await Can.viewUserPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            let usageSummaries = await context.batched.UsageSummary.many(
                {
                    subscriber: UserPK.stringify(parent),
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

        async updateUser(
            parent: User,
            { author, stripeCustomerId, stripeConnectAccountId }: GQLUserUpdateUserArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<User> {
            if (!(await Can.updateUser(parent, { author, stripeCustomerId, stripeConnectAccountId }, context))) {
                throw new Denied();
            }
            let user = await context.batched.User.update(parent, {
                author,
                stripeCustomerId,
                stripeConnectAccountId,
            });
            return user;
        },

        /**
         * settleAccountActivities should only be called from the billing queue.
         */
        async settleAccountActivities(parent: User, args: {}, context: RequestContext): Promise<AccountActivity[]> {
            if (!(await Can.settleUserAccountActivities(context))) {
                throw new Denied();
            }
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
            if (!(await Can.createUserPrivateResources(parent, context))) {
                throw new Denied();
            }
            let existing = await context.batched.UserAppToken.getOrNull({
                subscriber: UserPK.stringify(parent),
                app,
            });
            if (existing) {
                throw new TooManyResources("A token already exists for this user and app.");
            }
            let { userAppToken, token } = await createUserAppToken(context, { user: UserPK.stringify(parent), app });
            userAppToken.token = token; // Do not store the token string in the database.
            return userAppToken;
        },

        /**
         * Collect any account activities that are in the pending status, and have the
         * settleAt property in the past. Create a new account AccountHistory for the
         * collected activities, effectively updating the user's balance.
         */
        async updateBalance(parent: User, args: {}, context: RequestContext) {
            if (
                !context.isSQSMessage ||
                context.sqsQueueName !== "graphql-service-billing-queue.fifo" ||
                context.sqsMessageGroupId !== UserPK.stringify(parent)
            ) {
                if (!process.env.UNSAFE_BILLING) {
                    console.error(
                        chalk.red(
                            `updateBalance must be called from the graphql-service-billing-queue.fifo Queue, and use the user pk as the MessageGroupId. If you are not running in production, you can set the UNSAFE_BILLING=1 environment variable to bypass this check.`
                        )
                    );
                    console.error(chalk.red("Current context:"));
                    console.error(chalk.red(`isSQSMessage: ${context.isSQSMessage.toString()}`));
                    console.error(chalk.red(`sqsQueueName: ${context.sqsQueueName || "undefined"}`));
                    console.error(chalk.red(`sqsMessageGroupId: ${context.sqsMessageGroupId || "undefined"}`));
                    throw new Error("updateBalance must be called from an SQS message");
                }
            }
            await settleAccountActivities(context, UserPK.stringify(parent), {
                consistentReadAccountActivities: true,
            });
            return parent;
        },

        async getFastchargeAPIIdToken(
            parent: User,
            { expireInSeconds }: GQLUserGetFastchargeApiIdTokenArgs,
            context: RequestContext
        ): Promise<string> {
            if (!(await Can.createUserPrivateResources(parent, context))) {
                throw new Denied();
            }
            return makeFastchargeAPIIdTokenForUser({ user: parent, expireInSeconds: expireInSeconds || 3600 });
        },
    },
    Query: {
        // async users(parent: {}, args: {}, context: RequestContext): Promise<User[]> {
        //     if (!(await Can.listUsers(context))) {
        //         throw new Denied();
        //     }
        //     let users = await context.batched.User.scan();
        //     return users;
        // },
        async user(parent: {}, { pk, email }: GQLQueryUserArgs, context: RequestContext) {
            let user;
            if (email) {
                user = await context.batched.User.get(
                    { email },
                    {
                        using: GQLUserIndex.IndexByEmailOnlyPk,
                    }
                );
            } else if (pk) {
                user = await context.batched.User.get(UserPK.parse(pk));
            }
            if (!user) {
                throw new BadInput("id or email required");
            }
            // Does this need to be private? I don't think so, but I'll leave it
            // for now.
            if (!(await Can.viewUserPrivateAttributes(user, context))) {
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
            if (!(await Can.createUser(context))) {
                throw new Denied();
            }
            let user = await createUserWithEmail(context.batched, email);
            return user;
        },
    },
};
