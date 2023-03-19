import { StripePaymentAccept, StripePaymentAcceptModel, User } from "../dynamoose/models";
import { RequestContext } from "../RequestContext";
import { GQLResolvers, GQLStripePaymentAcceptResolvers } from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { settleAccountActivities } from "../functions/account";
import { GQLStripePaymentAcceptStatus } from "../__generated__/operation-types";
import { StripePaymentAcceptPK } from "../pks/StripePaymentAccept";
import { UserPK } from "../pks/UserPK";

function makeOwnerReadable<T>(
    getter: (parent: StripePaymentAccept, args: {}, context: RequestContext) => T
): (parent: StripePaymentAccept, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: StripePaymentAccept, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewStripePaymentAcceptPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const stripePaymentAcceptResolvers: GQLResolvers & {
    StripePaymentAccept: Required<GQLStripePaymentAcceptResolvers>;
} = {
    StripePaymentAccept: {
        __isTypeOf: (parent) => parent instanceof StripePaymentAcceptModel,
        amount: makeOwnerReadable((parent) => parent.amount),
        currency: makeOwnerReadable((parent) => parent.currency),
        stripePaymentIntent: makeOwnerReadable((parent) => parent.stripePaymentIntent),
        stripeSessionId: makeOwnerReadable((parent) => parent.stripeSessionId),
        stripePaymentStatus: makeOwnerReadable((parent) => parent.stripePaymentStatus),
        stripeSessionObject: makeOwnerReadable((parent) => JSON.stringify(parent.stripeSessionObject)),
        createdAt: makeOwnerReadable((parent) => parent.createdAt),
        status: makeOwnerReadable((parent) => parent.status as GQLStripePaymentAcceptStatus),

        async user(parent: StripePaymentAccept, args, context, info) {
            if (!(await Can.viewStripePaymentAcceptPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            let user = await context.batched.User.get(UserPK.parse(parent.user));
            return user;
        },

        /**
         * Important: This method must be idempotent. It must be safe to call
         * this more than once without adding more money to the user's balance.
         * TODO: add idempotency
         * @param parent
         * @param param1
         * @param context
         * @param info
         * @returns
         */
        async settlePayment(parent: StripePaymentAccept, { stripeSessionObject }, context) {
            if (!(await Can.settleUserAccountActivities(context))) {
                throw new Denied();
            }
            let activity = await context.batched.AccountActivity.create({
                user: parent.user,
                amount: parent.amount,
                type: "debit",
                reason: "topup",
                settleAt: Date.now(),
                description: "Account top-up by you",
                stripePaymentAccept: StripePaymentAcceptPK.stringify(parent),
            });
            await settleAccountActivities(context, parent.user, {
                consistentReadAccountActivities: true,
            });
            parent = await context.batched.StripePaymentAccept.update(parent, {
                stripeSessionObject: JSON.parse(stripeSessionObject),
                accountActivity: AccountActivityPK.stringify(activity),
                status: "settled",
            });
            return parent;
        },
    },
    Query: {
        // async stripePaymentAccept(parent: User, args: GQLQueryStripePaymentAcceptArgs, context, info) {
        //     if (!(await Can.readStripePaymentAccepts(parent, args, context))) {
        //         throw new Denied();
        //     }
        //     return await context.batched.StripePaymentAccept.get({
        //         stripeSessionId: args.stripeSessionId,
        //     });
        // },
    },
    Mutation: {},
};
