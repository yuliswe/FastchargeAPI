import {
    GQLAccountHistoryResolvers,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { AccountHistoryModel } from "../dynamoose/models";

/**
 * Remember to add your resolver to the resolvers object in server.ts.
 *
 * Note that to make the typing work, you must also add your Models to the
 * codegen.yml file, under the mappers section.
 */

export const accountHistoryResolvers: GQLResolvers & {
    AccountHistory: Required<GQLAccountHistoryResolvers>;
} = {
    AccountHistory: {
        __isTypeOf: (parent) => parent instanceof AccountHistoryModel,
        closingTime: (parent) => parent.closingTime,
        closingBalance: (parent) => parent.closingBalance,
    },
    Query: {},
    Mutation: {},
};
