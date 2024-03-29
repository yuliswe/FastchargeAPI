import { RequestContext } from "../RequestContext";
import {
    GQLAccountActivityReason,
    GQLAccountActivityResolvers,
    GQLAccountActivityStatus,
    GQLAccountActivityType,
    GQLMutationCreateAccountActivityArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { AccountActivity, AccountActivityModel, User } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { AppPK } from "../pks/AppPK";
import { StripeTransferPK } from "../pks/StripeTransferPK";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { UserPK } from "../pks/UserPK";

function makeOwnerReadable<T>(
    getter: (parent: AccountActivity, args: {}, context: RequestContext) => T
): (parent: AccountActivity, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: AccountActivity, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewAccountActivityPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const accountActivityResolvers: GQLResolvers & {
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
        type: makeOwnerReadable((parent) => parent.type as GQLAccountActivityType),
        reason: makeOwnerReadable((parent) => parent.reason as GQLAccountActivityReason),
        description: makeOwnerReadable((parent) => parent.description),
        status: makeOwnerReadable((parent) => parent.status as GQLAccountActivityStatus),
        settleAt: makeOwnerReadable((parent) => parent.settleAt),
        consumedFreeQuota: makeOwnerReadable((parent) => parent.consumedFreeQuota),
        async user(parent, args: {}, context: RequestContext): Promise<User> {
            if (!(await Can.viewAccountActivityPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await context.batched.User.get(UserPK.parse(parent.user));
        },
        async billedApp(parent: AccountActivity, args: {}, context, info) {
            if (!(await Can.viewAccountActivityPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            if (parent.billedApp) {
                return await context.batched.App.get(AppPK.parse(parent.billedApp));
            } else {
                return null;
            }
        },
        async usageSummary(parent, args, context, info) {
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
        async stripeTransfer(parent, args, context, info) {
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
        // async accountActivities(parent: {}, { status, using }: GQLQueryAccountActivitiesArgs, context: RequestContext) {
        //     let activities = await context.batched.AccountActivity.many({ status }, { using });
        //     return activities;
        // },
    },
    Mutation: {
        async createAccountActivity(
            parent: {},
            { user, amount, description, reason, settleAt, type }: GQLMutationCreateAccountActivityArgs,
            context: RequestContext
        ) {
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
    },
};
