import { Chalk } from "chalk";
import { GQLResolvers, GQLUsageSummaryResolvers } from "../__generated__/resolvers-types";
import { UsageSummary, UsageSummaryModel } from "../dynamoose/models";
import { triggerBilling } from "../functions/billing";
import { RequestContext } from "../RequestContext";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { UserPK } from "../pks/UserPK";
import { AppPK } from "../pks/AppPK";
import { AccountActivityPK } from "../pks/AccountActivityPK";

const chalk = new Chalk({ level: 3 });
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

export const usageSummaryResolvers: GQLResolvers & {
    UsageSummary: Required<GQLUsageSummaryResolvers>;
} = {
    UsageSummary: {
        __isTypeOf: (parent) => parent instanceof UsageSummaryModel,
        createdAt: makePrivate({}, (parent) => parent.createdAt),
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
        async billingAccountActivity(parent: UsageSummary, args: {}, context: RequestContext) {
            if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            if (parent.billingAccountActivity) {
                return context.batched.AccountActivity.getOrNull(
                    AccountActivityPK.parse(parent.billingAccountActivity)
                );
            } else {
                return null;
            }
        },
    },
    Query: {},
    Mutation: {
        /**
         * Used by the billing lambda to trigger billing.
         */
        async triggerBilling(parent, { user, app }, context, info) {
            if (!(await Can.settleUserAccountActivities(context))) {
                throw new Denied();
            }
            let result = await triggerBilling(context, { user, app });
            return result.affectedUsageSummaries;
        },
    },
};
