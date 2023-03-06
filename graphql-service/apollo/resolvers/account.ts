import {
    GQLResolvers,
    GQLAccountActivityResolvers,
    GQLAccountActivityType,
    GQLAccountActivityReason,
    GQLAccountActivityStatus,
} from "../__generated__/resolvers-types";
import { AccountActivityModel } from "../dynamoose/models";
import { StripeTransferPK } from "../pks/StripeTransferPK";

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
        createdAt: (parent) => parent.createdAt,
        amount: (parent) => parent.amount,
        type: (parent) => parent.type as GQLAccountActivityType,
        reason: (parent) => parent.reason as GQLAccountActivityReason,
        description: (parent) => parent.description,
        status: (parent) => parent.status as GQLAccountActivityStatus,
        settleAt: (parent) => parent.settleAt,

        async stripeTransfer(parent, args, context, info) {
            if (parent.stripeTransfer) {
                return await context.batched.StripeTransfer.get(
                    StripeTransferPK.parse(parent.stripeTransfer)
                );
            } else {
                return null;
            }
        },
    },
    Query: {},
    Mutation: {},
};
