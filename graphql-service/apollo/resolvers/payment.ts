import { GraphQLResolveInfo } from "graphql";
import {
    StripePaymentAccept,
    StripePaymentAcceptModel,
    User,
} from "../dynamoose/models";
import { RequestContext } from "../server";
import {
    GQLMutationCreateStripePaymentAcceptArgs,
    GQLQueryStripePaymentAcceptArgs,
    GQLResolvers,
    GQLStripePaymentAcceptResolvers,
} from "../__generated__/resolvers-types";
import Decimal from "decimal.js-light";
import { Denied } from "../errors";
import { Can } from "../permissions";
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
        amountCents: (parent) => parent.amountCents,
        currency: (parent) => parent.currency,
        status: (parent) => parent.status,
        stripePaymentIntent: (parent) => parent.stripePaymentIntent,
        stripeSessionId: (parent) => parent.stripeSessionId,
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
            context,
            info
        ) {
            let user = await context.batched.User.get({ email: parent.user });
            parent.stripeSessionObject = JSON.parse(stripeSessionObject);
            parent.status = "paid";
            parent.oldBalance = user.balance;
            // Be aware of floating point errors
            let balance = new Decimal(user.balance);
            balance = balance.add(new Decimal(parent.amountCents).div(100));
            user.balance = balance.toString();
            parent.newBalance = user.balance;
            await parent.save();
            await user.save();
            return parent;
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
            parent: never,
            {
                user,
                amountCents,
                currency,
                status,
                stripeSessionId,
                stripePaymentIntent,
                stripeSessionObject,
            }: GQLMutationCreateStripePaymentAcceptArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            let stripePaymentAccept = await StripePaymentAcceptModel.create({
                user,
                amountCents,
                currency,
                status,
                stripeSessionId,
                stripePaymentIntent,
                stripeSessionObject: JSON.parse(stripeSessionObject),
            });
            return stripePaymentAccept;
        },
    },
};
