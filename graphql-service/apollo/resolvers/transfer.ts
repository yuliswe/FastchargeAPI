import { GraphQLResolveInfo } from "graphql";
import {
    GQLMutationCreateStripeTransferArgs,
    GQLResolvers,
    GQLStripeTransferResolvers,
} from "../__generated__/resolvers-types";
import { StripeTransferModel } from "../dynamoose/models";
import { RequestContext } from "../RequestContext";
import Decimal from "decimal.js-light";
import { UserPK } from "../pks/UserPK";
import { collectAccountActivities } from "../functions/account";
import { AccountActivityPK } from "../pks/AccountActivityPK";

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
        currency: (parent) => parent.currency,

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
            let transferAmount = new Decimal(parent.withdrawCents).div(100);
            let activity = await context.batched.AccountActivity.create({
                user: UserPK.stringify(user),
                amount: transferAmount.toString(),
                type: "credit",
                reason: "payout",
            });
            await collectAccountActivities(context, UserPK.stringify(user));
            parent.accountActivity = AccountActivityPK.stringify(activity);
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
