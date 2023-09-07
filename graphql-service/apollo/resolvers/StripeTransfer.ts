import Decimal from "decimal.js-light";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateStripeTransferArgs,
    GQLQueryStripeTransferArgs,
    GQLResolvers,
    GQLStripeTransferResolvers,
    GQLStripeTransferStatus,
} from "../__generated__/resolvers-types";
import { StripeTransfer, StripeTransferModel } from "../database/models";
import { BadInput, Denied } from "../errors";
import { getUserBalance, settleAccountActivities } from "../functions/account";
import { enforceCalledFromQueue } from "../functions/aws";
import { createAccountActivitiesForTransfer } from "../functions/transfer";
import { Can } from "../permissions";
import { StripeTransferPK } from "../pks/StripeTransferPK";
import { UserPK } from "../pks/UserPK";

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

export const StripeTransferResolvers: GQLResolvers & {
    StripeTransfer: Required<GQLStripeTransferResolvers>;
} = {
    StripeTransfer: {
        __isTypeOf: (parent) => parent instanceof StripeTransferModel,
        pk: makePrivate((parent) => StripeTransferPK.stringify(parent)),
        withdrawAmount: makePrivate((parent) => parent.withdrawAmount),
        receiveAmount: makePrivate((parent) => parent.receiveAmount),
        stripeTransferId: makePrivate((parent) => parent.stripeTransferId),
        stripeTransferObject: makePrivate((parent) => JSON.stringify(parent.stripeTransferObject)),
        createdAt: makePrivate((parent) => parent.createdAt),
        currency: makePrivate((parent) => parent.currency),
        transferAt: makePrivate((parent) => parent.transferAt),
        status: makePrivate((parent) => parent.status),

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
            enforceCalledFromQueue(context, parent.receiver);
            if (!(await Can.settleUserAccountActivities(context))) {
                throw new Denied();
            }
            const user = await context.batched.User.get(UserPK.parse(parent.receiver));
            await createAccountActivitiesForTransfer(context, {
                transfer: parent,
                userPK: UserPK.stringify(user),
            });
            await settleAccountActivities(context, parent.receiver, {
                consistentReadAccountActivities: true,
            });
            return parent;
        },
    },
    Query: {
        async getStripeTransfer(
            parent: {},
            { pk }: GQLQueryStripeTransferArgs,
            context: RequestContext
        ): Promise<StripeTransfer> {
            if (!pk) {
                throw new BadInput("pk is required");
            }
            const transfer = await context.batched.StripeTransfer.get(StripeTransferPK.parse(pk));
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
            if (!context.isSQSMessage) {
                throw new Error("createStripeTransfer can only be called from the SQS");
            }
            if (context.sqsMessageGroupId !== receiver) {
                throw new Error(
                    `sqsMessageGroupId must match receiver: ${receiver}. Current: ${
                        context.sqsMessageGroupId ?? "undefined"
                    }`
                );
            }
            const balance = await getUserBalance(context, receiver);
            if (new Decimal(balance).lessThan(withdrawAmount)) {
                throw new BadInput(`User does not have enough balance to withdraw ${withdrawAmount}`);
            }
            return await context.batched.StripeTransfer.create({
                receiver,
                withdrawAmount,
                receiveAmount,
                stripeTransferId,
                currency,
                stripeTransferObject: stripeTransferObject && JSON.parse(stripeTransferObject),
                transferAt: Date.now() + 1000 * 60 * 60 * 24, // Transfer after 24 hours
                status: GQLStripeTransferStatus.Pending,
            });
        },
    },
};

/* Deprecated */
StripeTransferResolvers.Query!.stripeTransfer = StripeTransferResolvers.Query!.getStripeTransfer!;
