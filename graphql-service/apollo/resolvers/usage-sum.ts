import { Chalk } from "chalk";
import { GQLResolvers, GQLUsageSummaryResolvers } from "../__generated__/resolvers-types";
import { UsageSummary, UsageSummaryModel } from "../dynamoose/models";
import { generateAccountActivities, triggerBilling } from "../functions/billing";
import { findUserSubscriptionPricing } from "../functions/subscription";
import { collectUsageLogs } from "../functions/usage";
import { getUserByPK } from "../functions/user";
import { RequestContext } from "../RequestContext";
import { getAppByPK } from "../functions/app";
import { getAccountActivityByPK } from "../functions/account";

const chalk = new Chalk({ level: 3 });
/**
 * Remember to add your resolver to the resolvers object in server.ts.
 *
 * Note that to make the typing work, you must also add your Models to the
 * codegen.yml file, under the mappers section.
 */

export const usageSummaryResolvers: GQLResolvers & {
    UsageSummary: Required<GQLUsageSummaryResolvers>;
} = {
    UsageSummary: {
        __isTypeOf: (parent) => parent instanceof UsageSummaryModel,
        createdAt: (parent) => parent.createdAt,
        billedAt: (parent) => parent.billedAt,
        billed: (parent) => parent.billedAt !== undefined,
        volume: (parent) => parent.volume,
        subscriber(parent: UsageSummary, args: {}, context: RequestContext) {
            return getUserByPK(context, parent.subscriber);
        },
        app(parent: UsageSummary, args: {}, context: RequestContext) {
            return getAppByPK(context, parent.app);
        },
        billingAccountActivity(parent: UsageSummary, args: {}, context: RequestContext) {
            return parent.billingAccountActivity
                ? getAccountActivityByPK(context, parent.billingAccountActivity)
                : null;
        },
    },
    Query: {},
    Mutation: {
        async triggerBilling(parent, { user, app }, context, info) {
            let result = await triggerBilling(context, { user, app });
            return result.affectedUsageSummaries;
        },
    },
};
