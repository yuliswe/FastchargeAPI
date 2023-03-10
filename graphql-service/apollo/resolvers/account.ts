import { RequestContext } from "../RequestContext";
import {
    GQLResolvers,
    GQLAccountActivityResolvers,
    GQLAccountActivityType,
    GQLAccountActivityReason,
    GQLAccountActivityStatus,
    GQLQueryAccountActivitiesArgs,
} from "../__generated__/resolvers-types";
import { AccountActivity, AccountActivityModel } from "../dynamoose/models";
import { AppPK } from "../functions/AppPK";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { StripeTransferPK } from "../pks/StripeTransferPK";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";

/**
 * Remember to add your resolver to the resolvers object in server.ts.
 *
 * Note that to make the typing work, you must also add your Models to the
 * codegen.yml file, under the mappers section.
 */

export const accountActivityResolvers: GQLResolvers & {
    AccountActivity: Required<GQLAccountActivityResolvers>;
} = {
    AccountActivity: {
        __isTypeOf: (parent) => parent instanceof AccountActivityModel,
        pk: (parent) => AccountActivityPK.stringify(parent),
        createdAt: (parent) => parent.createdAt,
        amount: (parent) => parent.amount,
        type: (parent) => parent.type as GQLAccountActivityType,
        reason: (parent) => parent.reason as GQLAccountActivityReason,
        description: (parent) => parent.description,
        status: (parent) => parent.status as GQLAccountActivityStatus,
        settleAt: (parent) => parent.settleAt,
        async billedApp(parent: AccountActivity, args: {}, context, info) {
            if (parent.billedApp) {
                return await context.batched.App.get(AppPK.parse(parent.billedApp));
            } else {
                return null;
            }
        },
        async usageSummary(parent, args, context, info) {
            if (parent.usageSummary) {
                return await context.batched.UsageSummary.get(UsageSummaryPK.parse(parent.usageSummary));
            } else {
                return null;
            }
        },
        async stripeTransfer(parent, args, context, info) {
            if (parent.stripeTransfer) {
                return await context.batched.StripeTransfer.get(StripeTransferPK.parse(parent.stripeTransfer));
            } else {
                return null;
            }
        },
    },
    Query: {
        async accountActivities(parent: {}, { status, using }: GQLQueryAccountActivitiesArgs, context: RequestContext) {
            let activities = await context.batched.AccountActivity.many({ status }, { using });
            return activities;
        },
    },
    Mutation: {},
};
