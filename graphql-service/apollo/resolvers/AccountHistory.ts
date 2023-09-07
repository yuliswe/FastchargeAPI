import { RequestContext } from "../RequestContext";
import { GQLAccountHistoryResolvers, GQLResolvers } from "../__generated__/resolvers-types";
import { AccountHistory, AccountHistoryModel } from "../database/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { AccountHistoryPK } from "../pks/AccountHistoryPK";

function makeOwnerReadable<T>(
    getter: (parent: AccountHistory, args: {}, context: RequestContext) => T
): (parent: AccountHistory, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: AccountHistory, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewAccountHistoryPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const AccountHistoryResolvers: GQLResolvers & {
    AccountHistory: Required<GQLAccountHistoryResolvers>;
} = {
    AccountHistory: {
        __isTypeOf: (parent) => parent instanceof AccountHistoryModel,

        /***********************************************
         * All attributes readable to the account owner
         **********************************************/
        pk: makeOwnerReadable((parent) => AccountHistoryPK.stringify(parent)),
        closingTime: makeOwnerReadable((parent) => parent.closingTime),
        closingBalance: makeOwnerReadable((parent) => parent.closingBalance),
    },
    Query: {},
    Mutation: {},
};
