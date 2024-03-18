import { RequestContext } from "@/src/RequestContext";
import {
  GQLAccountActivityResolvers,
  GQLMutationCreateAccountActivityArgs,
  GQLMutationGetAccountActivityArgs,
  GQLMutation_SqsSettleAccountActivitiesForUserArgs,
  GQLQueryListAccountActivitiesByUserArgs,
  GQLResolvers,
} from "@/src/__generated__/resolvers-types";
import { AccountActivity, AccountActivityModel } from "@/src/database/models/AccountActivity";
import { StripeTransfer } from "@/src/database/models/StripeTransfer";
import { UsageSummary } from "@/src/database/models/UsageSummary";
import { User } from "@/src/database/models/User";
import { Denied } from "@/src/errors";
import { settleAccountActivitiesOnSQS, sqsSettleAccountActivities } from "@/src/functions/account";
import { Can } from "@/src/permissions";
import { AccountActivityPK } from "@/src/pks/AccountActivityPK";
import { AppPK } from "@/src/pks/AppPK";
import { StripeTransferPK } from "@/src/pks/StripeTransferPK";
import { UsageSummaryPK } from "@/src/pks/UsageSummaryPK";
import { UserPK } from "@/src/pks/UserPK";
import { GraphQLResolveInfoWithCacheControl } from "@apollo/cache-control-types";

function makeOwnerReadable<T>(
  getter: (parent: AccountActivity, args: {}, context: RequestContext) => T
): (
  parent: AccountActivity,
  args: {},
  context: RequestContext,
  info: GraphQLResolveInfoWithCacheControl
) => Promise<T> {
  return async (parent, args: {}, context, info): Promise<T> => {
    if (!(await Can.viewAccountActivityPrivateAttributes(parent, context))) {
      throw new Denied();
    }
    return getter(parent, args, context);
  };
}

export const AccountActivityResolvers: GQLResolvers & {
  AccountActivity: Required<GQLAccountActivityResolvers>;
} = {
  AccountActivity: {
    __isTypeOf: (parent) => parent instanceof AccountActivityModel,

    /***********************************************
     * All attributes readable to the account owner
     **********************************************/

    pk: makeOwnerReadable((parent) => AccountActivityPK.stringify(parent)),
    createdAt: makeOwnerReadable((parent) => parent.createdAt),
    amount: makeOwnerReadable((parent) => parent.amount),
    type: makeOwnerReadable((parent) => parent.type),
    reason: makeOwnerReadable((parent) => parent.reason),
    description: makeOwnerReadable((parent) => parent.description),
    status: makeOwnerReadable((parent) => parent.status),
    settleAt: makeOwnerReadable((parent) => parent.settleAt),
    consumedFreeQuota: makeOwnerReadable((parent) => parent.consumedFreeQuota),
    async user(parent: AccountActivity, args: {}, context: RequestContext): Promise<User> {
      if (!(await Can.viewAccountActivityPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      return await context.batched.User.get(UserPK.parse(parent.user));
    },
    async billedApp(parent: AccountActivity, args: {}, context: RequestContext) {
      if (!(await Can.viewAccountActivityPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      if (parent.billedApp) {
        return await context.batched.App.get(AppPK.parse(parent.billedApp));
      } else {
        return null;
      }
    },
    async usageSummary(parent: AccountActivity, args: {}, context: RequestContext): Promise<UsageSummary | null> {
      if (!(await Can.viewAccountActivityPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      if (parent.usageSummary) {
        // Use getOrNull because the usage summary may have been deleted
        return await context.batched.UsageSummary.getOrNull(UsageSummaryPK.parse(parent.usageSummary));
      } else {
        return null;
      }
    },
    async stripeTransfer(parent: AccountActivity, args: {}, context: RequestContext): Promise<StripeTransfer | null> {
      if (!(await Can.viewAccountActivityPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      if (parent.stripeTransfer) {
        // Use getOrNull because the transfer may have been deleted
        return await context.batched.StripeTransfer.getOrNull(StripeTransferPK.parse(parent.stripeTransfer));
      } else {
        return null;
      }
    },

    /*****************************************************
     * All attributes that are only visible to the system
     *****************************************************/
  },
  Query: {
    async listAccountActivitiesByUser(
      parent: {},
      args: GQLQueryListAccountActivitiesByUserArgs,
      context: RequestContext
    ) {
      if (!(await Can.listAccountActivitiesByUser(args, context))) {
        throw new Denied();
      }
      const { user, limit, dateRange } = args;
      const activities = await context.batched.AccountActivity.many(
        {
          user,
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
      return activities;
    },
    async getAccountActivity(
      parent: {},
      args: GQLMutationGetAccountActivityArgs,
      context: RequestContext
    ): Promise<AccountActivity> {
      const { pk } = args;
      const item = await context.batched.AccountActivity.get(AccountActivityPK.parse(pk));
      if (!(await Can.queryAccountActivity(item, context))) {
        throw new Denied();
      }
      return item;
    },
  },
  Mutation: {
    /**
     * @deprecated
     * Used for adding money to a user's account for testing cli.
     */
    async createAccountActivity(
      parent: {},
      args: GQLMutationCreateAccountActivityArgs,
      context: RequestContext
    ): Promise<AccountActivity> {
      const { user, amount, description, reason, settleAt, type, settleImmediately } = args;
      if (!(await Can.createAccountActivity(context))) {
        throw new Denied();
      }
      const accountActivity = await context.batched.AccountActivity.create({
        user,
        amount,
        description,
        reason,
        settleAt: settleAt ?? Date.now() - 60_000,
        type,
      });
      if (settleImmediately) {
        await settleAccountActivitiesOnSQS(user);
      }
      return accountActivity;
    },

    async _sqsSettleAccountActivitiesForUser(
      parent: {},
      args: GQLMutation_SqsSettleAccountActivitiesForUserArgs,
      context: RequestContext
    ) {
      const { user } = args;
      await sqsSettleAccountActivities(context, user);
      return true;
    },
  },
};