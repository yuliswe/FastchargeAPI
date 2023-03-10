import { GraphQLResolveInfo } from "graphql";
import {
    StripePaymentAccept,
    StripePaymentAcceptModel,
    User,
} from "../dynamoose/models";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateStripePaymentAcceptArgs,
    GQLQueryStripePaymentAcceptArgs,
    GQLResolvers,
    GQLStripePaymentAcceptResolvers,
    GQLStripePaymentAcceptUpdateStripePaymentAcceptArgs,
} from "../__generated__/resolvers-types";
import { BadInput, Denied } from "../errors";
import { Can } from "../permissions";
import { UserPK } from "../pks/UserPK";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { settleAccountActivities } from "../functions/account";
/**
 * Remember to add your resolver to the resolvers object in server.ts.
 *
 * Note that to make the typing work, you must also add your Models to the
 * codegen.yml file, under the mappers section.
 */
export const stripePaymentAcceptResolvers: GQLResolvers & {
    StripePaymentAccept: Required<GQLStripePaymentAcceptResolvers>;
} = {
    StripePaymentAccept: {
        __isTypeOf: (parent) => parent instanceof StripePaymentAcceptModel,
        async user(parent: StripePaymentAccept, args, context, info) {
            let user = await context.batched.User.get(parent.user);
            return user;
        },
        amount: (parent) => parent.amount,
        currency: (parent) => parent.currency,
        stripePaymentIntent: (parent) => parent.stripePaymentIntent,
        stripeSessionId: (parent) => parent.stripeSessionId,
        stripePaymentStatus: (parent) => parent.stripePaymentStatus,
        stripeSessionObject: (parent) =>
            JSON.stringify(parent.stripeSessionObject),
        createdAt: (parent) => parent.createdAt,

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
        async settlePayment(
            parent: StripePaymentAccept,
            { stripeSessionObject },
            context
        ) {
            let user = await context.batched.User.get({ email: parent.user });
            let activity = await context.batched.AccountActivity.create({
                user: UserPK.stringify(user),
                amount: parent.amount,
                type: "debit",
                reason: "topup",
                settleAt: Date.now(),
                description: "Account top-up by you",
            });
            parent.stripeSessionObject = JSON.parse(stripeSessionObject);
            parent.accountActivity = AccountActivityPK.stringify(activity);
            await settleAccountActivities(context, UserPK.stringify(user), {
                consistentReadAccountActivities: true,
            });
            await parent.save();
            return parent;
        },

        async updateStripePaymentAccept(
            parent: StripePaymentAccept,
            {
                stripePaymentStatus,
                stripeSessionObject,
            }: GQLStripePaymentAcceptUpdateStripePaymentAcceptArgs,
            context: RequestContext
        ) {
            let newPayment = await context.batched.StripePaymentAccept.update(
                parent,
                {
                    stripePaymentStatus:
                        (stripePaymentStatus as typeof parent.stripePaymentStatus) ||
                        undefined,
                    stripeSessionObject: stripeSessionObject
                        ? JSON.parse(stripeSessionObject)
                        : undefined,
                }
            );
            return newPayment;
        },
    },
    Query: {
        async stripePaymentAccept(
            parent: User,
            args: GQLQueryStripePaymentAcceptArgs,
            context,
            info
        ) {
            if (!(await Can.readStripePaymentAccepts(parent, args, context))) {
                throw new Denied();
            }
            return await context.batched.StripePaymentAccept.get({
                stripeSessionId: args.stripeSessionId,
            });
        },
    },
    Mutation: {
        async createStripePaymentAccept(
            parent: {},
            {
                user,
                amount,
                currency,
                stripePaymentStatus,
                stripeSessionId,
                stripePaymentIntent,
                stripeSessionObject,
            }: GQLMutationCreateStripePaymentAcceptArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            if (stripePaymentStatus !== "paid") {
                throw new BadInput("stripePaymentStatus must be paid");
            }
            let stripePaymentAccept = await StripePaymentAcceptModel.create({
                user,
                amount,
                currency,
                stripePaymentStatus: stripePaymentStatus as any,
                stripeSessionId,
                stripePaymentIntent,
                stripeSessionObject: JSON.parse(stripeSessionObject),
            });
            return stripePaymentAccept;
        },
    },
};
