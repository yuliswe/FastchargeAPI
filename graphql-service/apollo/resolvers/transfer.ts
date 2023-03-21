import {
    GQLMutationCreateStripeTransferArgs,
    GQLQueryStripeTransferArgs,
    GQLResolvers,
    GQLStripeTransferResolvers,
    GQLStripeTransferStatus,
} from "../__generated__/resolvers-types";
import { StripeTransfer, StripeTransferModel } from "../dynamoose/models";
import { RequestContext } from "../RequestContext";
import { UserPK } from "../pks/UserPK";
import { createAccountActivitiesForTransfer } from "../functions/transfer";
import { BadInput, Denied } from "../errors";
import { Can } from "../permissions";
import { StripeTransferPK } from "../pks/StripeTransferPK";

/**
 * Make is so that only the owner can read the private attributes.
 */
function makePrivate<T>(
    getter: (parent: StripeTransfer, args: {}, context: RequestContext) => T
): (parent: StripeTransfer, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: StripeTransfer, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewStripeTransferPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const stripeTransferResolvers: GQLResolvers & {
    StripeTransfer: Required<GQLStripeTransferResolvers>;
} = {
    StripeTransfer: {
        __isTypeOf: (parent) => parent instanceof StripeTransferModel,

        withdrawAmount: makePrivate((parent) => parent.withdrawAmount),
        receiveAmount: makePrivate((parent) => parent.receiveAmount),
        stripeTransferId: makePrivate((parent) => parent.stripeTransferId),
        stripeTransferObject: makePrivate((parent) => JSON.stringify(parent.stripeTransferObject)),
        createdAt: makePrivate((parent) => parent.createdAt),
        currency: makePrivate((parent) => parent.currency),
        transferAt: makePrivate((parent) => parent.transferAt),
        status: makePrivate((parent) => parent.status as GQLStripeTransferStatus),

        async receiver(parent, args, context, info) {
            if (!(await Can.viewStripeTransferPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            return await context.batched.User.get(UserPK.parse(parent.receiver));
        },
        /**
         * A StripeTransfer happens when the user withdraws money from their
         * account. Calling this method creates an AccountActivity for the user,
         * substracting the withdrawl amount from their balance.
         *
         * This method is tipically called from the payment-service.
         */
        async settleStripeTransfer(parent: StripeTransfer, args: {}, context: RequestContext): Promise<StripeTransfer> {
            if (!(await Can.settleUserAccountActivities(context))) {
                throw new Denied();
            }
            let user = await context.batched.User.get(UserPK.parse(parent.receiver));
            await createAccountActivitiesForTransfer(context, {
                transfer: parent,
                userPK: UserPK.stringify(user),
            });
            return parent;
        },
    },
    Query: {
        async stripeTransfer(
            parent: {},
            { pk }: GQLQueryStripeTransferArgs,
            context: RequestContext
        ): Promise<StripeTransfer> {
            if (!pk) {
                throw new BadInput("pk is required");
            }
            let transfer = await context.batched.StripeTransfer.get(StripeTransferPK.parse(pk));
            if (!(await Can.viewStripeTransfer(transfer, context))) {
                throw new Denied();
            }
            return transfer;
        },
    },
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
            context: RequestContext
        ) {
            if (!(await Can.createStripeTransfer(context))) {
                throw new Denied();
            }
            let transfer = await context.batched.StripeTransfer.create({
                receiver,
                withdrawAmount,
                receiveAmount,
                stripeTransferId,
                currency,
                stripeTransferObject: stripeTransferObject && JSON.parse(stripeTransferObject),
                transferAt: Date.now() + 1000 * 60 * 60 * 24, // Transfer after 24 hours
                status: "pending",
            });
            return transfer;
        },
    },
};
