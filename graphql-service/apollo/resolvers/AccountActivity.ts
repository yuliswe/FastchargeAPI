import { RequestContext } from "@/RequestContext";
import { AccountActivity, AccountActivityModel } from "@/database/models/AccountActivity";
import { StripeTransfer } from "@/database/models/StripeTransfer";
import { UsageSummary } from "@/database/models/UsageSummary";
import { User } from "@/database/models/User";
import { settleAccountActivitiesFromSQS as sqsSettleAccountActivities } from "@/functions/account";
import { AppPK } from "@/pks/AppPK";
import { GraphQLResolveInfoWithCacheControl } from "@apollo/cache-control-types";
import {
    GQLAccountActivityResolvers,
    GQLMutationCreateAccountActivityArgs,
    GQLMutationGetAccountActivityArgs,
    GQLMutation_SqsSettleAccountActivitiesForUserArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { StripeTransferPK } from "../pks/StripeTransferPK";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { UserPK } from "../pks/UserPK";

function makeOwnerReadable<T>(
    getter: (parent: AccountActivity, args: {}, context: RequestContext) => T
): (parent: AccountActivity, args: {}, context: RequestContext, info: GraphQLResolveInfoWithCacheControl) => Promise<T> {
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
        async stripeTransfer(
            parent: AccountActivity,
            args: {},
            context: RequestContext
        ): Promise<StripeTransfer | null> {
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
        // async accountActivities(parent: {}, { status, using }: GQLQueryAccountActivitiesArgs, context) {
        //     let activities = await context.batched.AccountActivity.many({ status }, { using });
        //     return activities;
        // },
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
        async createAccountActivity(
            parent: {},
            args: GQLMutationCreateAccountActivityArgs,
            context: RequestContext
        ): Promise<AccountActivity> {
            const { user, amount, description, reason, settleAt, type } = args;
            if (!(await Can.createAccountActivity(context))) {
                throw new Denied();
            }
            return await context.batched.AccountActivity.create({
                user,
                amount,
                description,
                reason,
                settleAt: settleAt ?? Date.now(),
                type,
            });
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

/* Deprecated */
AccountActivityResolvers.Query!.accountActivity = AccountActivityResolvers.Query?.getAccountActivity;
