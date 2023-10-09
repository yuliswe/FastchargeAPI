import { AccountHistory, AccountHistoryModel } from "@/database/models/AccountHistory";
import { UserPK } from "@/pks/UserPK";
import { RequestContext } from "../RequestContext";
import {
    GQLAccountHistoryResolvers,
    GQLQueryListAccountHistoryByUserArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
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
        startingTime: makeOwnerReadable((parent) => parent.startingTime),
        closingTime: makeOwnerReadable((parent) => parent.closingTime),
        startingBalance: makeOwnerReadable((parent) => parent.startingBalance),
        closingBalance: makeOwnerReadable((parent) => parent.closingBalance),
        user: makeOwnerReadable((parent, _: {}, context) => context.batched.User.get(UserPK.parse(parent.user))),
    },
    Query: {
        async listAccountHistoryByUser(
            parent,
            { user, dateRange, limit }: GQLQueryListAccountHistoryByUserArgs,
            context
        ) {
            if (!(await Can.listAccountHistoryByUser({ user }, context))) {
                throw new Denied();
            }
            return await context.batched.AccountHistory.many(
                {
                    user,
                    closingTime: dateRange
                        ? {
                              le: dateRange.end ?? undefined,
                              ge: dateRange.start ?? undefined,
                          }
                        : undefined,
                },
                {
                    limit,
                    sort: "descending",
                }
            );
        },
        async getAccountHistory(parent, { pk }, context) {
            if (!(await Can.getAccountHistory(context))) {
                throw new Denied();
            }
            return await context.batched.AccountHistory.get(AccountHistoryPK.parse(pk));
        },
    },
    Mutation: {},
};
