import { StripePaymentAccept, StripePaymentAcceptModel, User } from "../dynamoose/models";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateStripePaymentAcceptArgs,
    GQLQueryStripePaymentAcceptArgs,
    GQLResolvers,
    GQLStripePaymentAcceptResolvers,
    GQLStripePaymentAcceptSettlePaymentArgs,
} from "../__generated__/resolvers-types";
import { AlreadyExists, Denied } from "../errors";
import { Can } from "../permissions";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { enforceCalledFromQueue, settleAccountActivities } from "../functions/account";
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
         */
        async settlePayment(
            parent: StripePaymentAccept,
            { stripePaymentStatus, stripeSessionObject, stripePaymentIntent }: GQLStripePaymentAcceptSettlePaymentArgs,
            context
        ) {
            enforceCalledFromQueue(context, parent.user);
            if (!(await Can.settleUserAccountActivities(context))) {
                throw new Denied();
            }
            const activity = await context.batched.AccountActivity.create({
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
                stripeSessionObject: stripeSessionObject && JSON.parse(stripeSessionObject),
                stripePaymentStatus: stripePaymentStatus as StripePaymentAccept["stripePaymentStatus"] | undefined,
                stripePaymentIntent,
                accountActivity: AccountActivityPK.stringify(activity),
                status: "settled",
            });
            return parent;
        },
    },
    Query: {
        async stripePaymentAccept(parent: User, args: GQLQueryStripePaymentAcceptArgs, context, info) {
            let item = await context.batched.StripePaymentAccept.get({
                stripeSessionId: args.stripeSessionId,
            });
            if (!(await Can.viewStripePaymentAccept(item, context))) {
                throw new Denied();
            }
            return item;
        },
    },
    Mutation: {
        async createStripePaymentAccept(
            parent: {},
            {
                user,
                amount,
                stripeSessionId,
                stripeSessionObject,
                stripePaymentIntent,
                stripePaymentStatus,
            }: GQLMutationCreateStripePaymentAcceptArgs,
            context: RequestContext
        ): Promise<StripePaymentAccept> {
            if (!(await Can.createStripePaymentAccept(context))) {
                throw new Denied();
            }
            let existing = await context.batched.StripePaymentAccept.getOrNull({
                user: user,
                stripeSessionId: stripeSessionId,
            });
            if (existing) {
                throw new AlreadyExists("StripePaymentAccept", "user,stripeSessionId");
            }
            return await context.batched.StripePaymentAccept.create({
                user,
                amount,
                stripeSessionId,
                stripeSessionObject: JSON.parse(stripeSessionObject),
                stripePaymentIntent,
                stripePaymentStatus: stripePaymentStatus as StripePaymentAccept["stripePaymentStatus"],
            });
        },
    },
};
