import { Chalk } from "chalk";
import {
    GQLResolvers,
    GQLUsageSummaryResolvers,
} from "../__generated__/resolvers-types";
import { UsageSummaryModel } from "../dynamoose/models";
import {
    generateAccountActivities,
    triggerBilling,
} from "../functions/billing";
import { findUserSubscriptionPricing } from "../functions/subscription";
import { collectUsageLogs } from "../functions/usage";

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
    },
    Query: {},
    Mutation: {
        async triggerBilling(parent, { user, app }, context, info) {
            let result = await triggerBilling(context, { user, app });
            if (result) {
                return result.usageSummary;
            } else {
                return null;
            }
        },
    },
};
