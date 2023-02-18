import { GraphQLResolveInfo } from "graphql";
import {
    GQLMutationCreateStripeTransferArgs,
    GQLResolvers,
    GQLStripeTransferResolvers,
} from "../__generated__/resolvers-types";
import { StripeTransferModel } from "../dynamoose/models";
import { RequestContext } from "../RequestContext";
import Decimal from "decimal.js-light";

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
        withdrawCents: (parent) => parent.withdrawCents,
        receiveCents: (parent) => parent.receiveCents,
        stripeTransferId: (parent) => parent.stripeTransferId,
        stripeTransferObject: (parent) =>
            JSON.stringify(parent.stripeTransferObject),
        createdAt: (parent) => parent.createdAt,
        newBalance: (parent) => parent.newBalance,
        oldBalance: (parent) => parent.oldBalance,
        currency: (parent) => parent.currency,

        /**
         * Calling this method will substract the amountCents from the
         * receiver's balance.
         * @param parent
         * @param args
         * @param context
         * @param info
         */
        async settleStripeTransfer(parent, args, context, info) {
            let user = await context.batched.User.get({
                email: parent.receiver,
            });
            parent.status = "paid";
            let balance = new Decimal(user.balance);
            let transferAmount = new Decimal(parent.withdrawCents).div(100);
            let newBalance = balance.minus(transferAmount);
            parent.oldBalance = user.balance;
            parent.newBalance = newBalance.toString();
            user.balance = newBalance.toString();
            await user.save();
            await parent.save();
            return parent;
        },
    },
    Query: {},
    Mutation: {
        async createStripeTransfer(
            parent,
            args: GQLMutationCreateStripeTransferArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            let {
                receiver,
                withdrawCents,
                receiveCents,
                stripeTransferId,
                stripeTransferObject,
                currency,
            } = args;
            let transfer = await StripeTransferModel.create({
                receiver,
                withdrawCents,
                receiveCents,
                stripeTransferId,
                currency,
                stripeTransferObject: JSON.parse(stripeTransferObject),
            });
            return transfer;
        },
    },
};
