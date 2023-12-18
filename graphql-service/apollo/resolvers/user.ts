import { App, AppTableIndex } from "@/database/models/App";
import { Subscription } from "@/database/models/Subscription";
import { User, UserModel, UserTableIndex } from "@/database/models/User";
import type { GraphQLResolveInfoWithCacheControl } from "@apollo/cache-control-types";
import { Chalk } from "chalk";
import { RequestContext } from "../RequestContext";
import {
  GQLMutationCreateUserArgs,
  GQLQueryUserArgs,
  GQLResolvers,
  GQLUserAccountActivitiesArgs,
  GQLUserGetFastchargeApiIdTokenArgs,
  GQLUserResolvers,
  GQLUserUpdateUserArgs,
  GQLUserUsageSummariesArgs,
} from "../__generated__/resolvers-types";
import { BadInput, Denied } from "../errors";
import { getUserBalance } from "../functions/account";
import { createUserWithEmail, makeFastchargeAPIIdTokenForUser } from "../functions/user";
import { Can } from "../permissions";
import { UserPK } from "../pks/UserPK";
import { AccountHistoryResolvers } from "./AccountHistory";
const chalk = new Chalk({ level: 3 });

function makePrivate<T>(
  getter: (parent: User, args: {}, context: RequestContext, info: GraphQLResolveInfoWithCacheControl) => T
): (parent: User, args: {}, context: RequestContext, info: GraphQLResolveInfoWithCacheControl) => Promise<T> {
  return async (
    parent: User,
    args: {},
    context: RequestContext,
    info: GraphQLResolveInfoWithCacheControl
  ): Promise<T> => {
    if (!(await Can.viewUserPrivateAttributes(parent, context))) {
      throw new Denied();
    }
    return getter(parent, args, context, info);
  };
}

export const UserResolvers: GQLResolvers & {
  User: Required<GQLUserResolvers>;
} = {
  User: {
    /**************************
     * All public attributes
     **************************/

    __isTypeOf: (parent) => parent instanceof UserModel,
    createdAt: makePrivate((parent) => parent.createdAt),
    updatedAt: makePrivate((parent) => parent.updatedAt),
    author: (parent) => parent.author || "", // users name that is visible to everyone.

    /**
     * @returns apps owned by this user. All apps are public information.
     */
    async apps(parent: User, args: {}, context: RequestContext): Promise<App[]> {
      const apps = await context.batched.App.many(
        { owner: UserPK.stringify(parent) },
        {
          using: AppTableIndex.Owner,
        }
      );
      return apps;
    },

    /**************************
     * All private attributes
     **************************/
    pk: makePrivate((parent, args, context, { cacheControl }) => {
      cacheControl.setCacheHint({ maxAge: 999 });
      return UserPK.stringify(parent);
    }),
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
    // async stripePaymentAccept(parent, { stripeSessionId }: GQLUserStripePaymentAcceptArgs, context) {
    //     if (!(await Can.viewUserPrivateAttributes(parent, context))) {
    //         throw new Denied();
    //     }
    //     if (!stripeSessionId) {
    //         throw new BadInput("stripeSessionId required");
    //     }
    //     return await context.batched.StripePaymentAccept.get({ user: UserPK.stringify(parent), stripeSessionId });
    // },

    async accountActivities(parent: User, { limit, dateRange }: GQLUserAccountActivitiesArgs, context) {
      if (!(await Can.viewUserPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      const result = await context.batched.AccountActivity.many(
        {
          user: UserPK.stringify(parent),
          createdAt: dateRange
            ? {
                le: dateRange.end ?? undefined,
                ge: dateRange.start ?? undefined,
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

    async accountHistories(parent: User, { limit, dateRange }: GQLUserAccountActivitiesArgs, context, info) {
      return AccountHistoryResolvers.Query!.listAccountHistoryByUser!(
        {},
        { user: UserPK.stringify(parent), limit, dateRange },
        context,
        info
      );
    },

    async usageSummaries(parent: User, { limit, app, dateRange }: GQLUserUsageSummariesArgs, context, info) {
      if (!(await Can.viewUserPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      const usageSummaries = await context.batched.UsageSummary.many(
        {
          subscriber: UserPK.stringify(parent),
          app,
          createdAt: dateRange
            ? {
                le: dateRange.end ?? undefined,
                ge: dateRange.start ?? undefined,
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
      context: RequestContext
    ): Promise<User> {
      if (!(await Can.updateUser(parent, { author, stripeCustomerId, stripeConnectAccountId }, context))) {
        throw new Denied();
      }
      const user = await context.batched.User.update(parent, {
        author: author ?? undefined,
        stripeCustomerId,
        stripeConnectAccountId,
      });
      return user;
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
    async getUser(parent: {}, { pk, email }: GQLQueryUserArgs, context: RequestContext) {
      let user;
      if (email) {
        user = await context.batched.User.get(
          { email },
          {
            using: UserTableIndex.IndexByEmailOnlyPk,
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
      if (!(await Can.queryUser(user, context))) {
        throw new Denied();
      }
      return user;
    },
  },
  Mutation: {
    /**
     * Used for testing CLI only
     */
    async createUser(parent: {}, { email }: GQLMutationCreateUserArgs, context: RequestContext): Promise<User> {
      if (!(await Can.createUser(context))) {
        throw new Denied();
      }
      const user = await createUserWithEmail(context.batched, email);
      return user;
    },
  },
};

/* Deprecated */
UserResolvers.Query!.user = UserResolvers.Query!.getUser;
