import {
    GQLResolvers,
    GQLUsageSummaryResolvers,
} from "../__generated__/resolvers-types";
import { UsageSummaryModel } from "../dynamoose/models";
import { collectUsageLogs } from "../functions/usage";

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
        async collectUsageLogs(parent, { user }, context, info) {
            let usageSummary = await collectUsageLogs(context, user);
            return usageSummary;
        },
    },
};
