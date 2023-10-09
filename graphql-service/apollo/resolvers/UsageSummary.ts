import { UsageSummary, UsageSummaryModel } from "@/database/models/UsageSummary";
import { AppPK } from "@/pks/AppPK";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationTriggerBillingArgs,
    GQLQueryListUsageSummariesArgs,
    GQLResolvers,
    GQLUsageSummaryResolvers,
} from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { triggerBilling } from "../functions/billing";
import { Can } from "../permissions";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { UserPK } from "../pks/UserPK";

/**
 * Make is so that only the owner can read the private attributes.
 */
function makePrivate<T>(
    { allowAppOwner = false }: { allowAppOwner?: boolean } = {},
    getter: (parent: UsageSummary) => T
): (parent: UsageSummary, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: UsageSummary, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context, { allowAppOwner }))) {
            throw new Denied();
        }
        return getter(parent);
    };
}

export const UsageSummaryResolvers: GQLResolvers & {
    UsageSummary: Required<GQLUsageSummaryResolvers>;
} = {
    UsageSummary: {
        __isTypeOf: (parent) => parent instanceof UsageSummaryModel,
        pk: makePrivate({}, (parent) => UsageSummaryPK.stringify(parent)),
        createdAt: makePrivate({}, (parent) => parent.createdAt),
        status: makePrivate({}, (parent) => parent.status),
        billedAt: makePrivate({}, (parent) => parent.billedAt),
        billed: makePrivate({}, (parent) => parent.billedAt !== undefined),
        // The volume is made viewable to the app owner so that in the app
        // owner's dashboard they can see they much their users are using.
        volume: makePrivate({ allowAppOwner: true }, (parent) => parent.volume),
        async subscriber(parent: UsageSummary, args: {}, context: RequestContext) {
            if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return context.batched.User.get(UserPK.parse(parent.subscriber));
        },
        async app(parent: UsageSummary, args: {}, context: RequestContext) {
            if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return context.batched.App.get(AppPK.parse(parent.app));
        },
        async billingRequestChargeAccountActivity(parent: UsageSummary, args: {}, context: RequestContext) {
            if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            if (parent.billingRequestChargeAccountActivity) {
                return context.batched.AccountActivity.getOrNull(
                    AccountActivityPK.parse(parent.billingRequestChargeAccountActivity)
                );
            } else {
                return null;
            }
        },
    },
    Query: {
        async listUsageSummaries(
            parent: {},
            { subscriber, app, limit, dateRange }: GQLQueryListUsageSummariesArgs,
            context: RequestContext
        ) {
            if (!(await Can.listUsageSummaries({ subscriber }, context))) {
                throw new Denied();
            }
            const usageSummaries = await context.batched.UsageSummary.many(
                {
                    subscriber,
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
    },
    Mutation: {
        /**
         * Used by the billing lambda to trigger billing.
         */
        async triggerBilling(parent, { user, app, path }: GQLMutationTriggerBillingArgs, context) {
            if (!(await Can.triggerBilling(context))) {
                throw new Denied();
            }
            const result = await triggerBilling(context, { user, app, path });
            return result.affectedUsageSummaries;
        },
    },
};
