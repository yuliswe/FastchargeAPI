import { GraphQLResolveInfo } from "graphql";
import {
    GQLMutationCreateStripeTransferArgs,
    GQLResolvers,
    GQLStripeTransferResolvers,
    GQLStripeTransferStatus,
} from "../__generated__/resolvers-types";
import { StripeTransferModel } from "../dynamoose/models";
import { RequestContext } from "../RequestContext";
import Decimal from "decimal.js-light";
import { UserPK } from "../pks/UserPK";
import { collectAccountActivities, getUserBalance } from "../functions/account";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { BadInput } from "../errors";
import { createAccountActivitiesForTransfer } from "../functions/transfer";

/**
 * Remember to add your resolver to the resolvers object in server.ts.
 *
 * Note that to make the typing work, you must also add your Models to the
 * codegen.yml file, under the mappers section.
 */
export const stripeTransferResolvers: GQLResolvers & {
    StripeTransfer: Required<GQLStripeTransferResolvers>;
} = {
    StripeTransfer: {
        __isTypeOf: (parent) => parent instanceof StripeTransferModel,
        async receiver(parent, args, context, info) {
            let user = await context.batched.User.get(parent.receiver);
            return user;
        },
        withdrawAmount: (parent) => parent.withdrawAmount,
        receiveAmount: (parent) => parent.receiveAmount,
        stripeTransferId: (parent) => parent.stripeTransferId,
        stripeTransferObject: (parent) =>
            JSON.stringify(parent.stripeTransferObject),
        createdAt: (parent) => parent.createdAt,
        currency: (parent) => parent.currency,
        transferAt: (parent) => parent.transferAt,
        status: (parent) => parent.status as GQLStripeTransferStatus,

        /**
         * A StripeTransfer happens when the user withdraws money from their
         * account. Calling this method creates an AccountActivity for the user,
         * substracting the withdrawl amount from their balance.
         *
         * This method is tipically called from the payment-service.
         * @param parent
         * @param args
         * @param context
         * @param info
         */
        async settleStripeTransfer(parent, args: never, context, info) {
            let user = await context.batched.User.get({
                email: parent.receiver,
            });
            await createAccountActivitiesForTransfer(context, {
                transfer: parent,
                userPK: UserPK.stringify(user),
            });
            return parent;
        },
    },
    Query: {},
    Mutation: {
        async createStripeTransfer(
            parent,
            {
                receiver,
                withdrawAmount,
                receiveAmount,
                currency,
                stripeTransferId,
                stripeTransferObject,
            }: GQLMutationCreateStripeTransferArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            let transfer = await context.batched.StripeTransfer.create({
                receiver,
                withdrawAmount,
                receiveAmount,
                stripeTransferId,
                currency,
                stripeTransferObject:
                    stripeTransferObject && JSON.parse(stripeTransferObject),
                transferAt: Date.now() + 1000 * 60 * 60 * 24, // Transfer after 24 hours
                status: "pending",
            });
            return transfer;
        },
    },
};
