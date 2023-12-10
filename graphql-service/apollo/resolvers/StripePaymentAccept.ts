import { StripePaymentAccept, StripePaymentAcceptModel } from "@/database/models/StripePaymentAccept";
import { enforceCalledFromSQS } from "@/functions/aws";
import { getSQSDedupIdForSettleStripePaymentAccept } from "@/functions/payment";
import { SQSQueueName, sqsGQLClient } from "@/sqsClient";
import { graphql } from "@/typed-graphql";
import { RequestContext } from "../RequestContext";
import {
    AccountActivityReason,
    AccountActivityType,
    GQLResolvers,
    GQLStripePaymentAcceptResolvers,
    StripePaymentAcceptStatus,
} from "../__generated__/resolvers-types";
import { AlreadyExists, Denied } from "../errors";
import { settleAccountActivitiesFromSQS } from "../functions/account";
import { Can } from "../permissions";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { StripePaymentAcceptPK } from "../pks/StripePaymentAccept";
import { UserPK } from "../pks/UserPK";

function makePrivate<T>(
    getter: (parent: StripePaymentAccept, args: {}, context: RequestContext) => T
): (parent: StripePaymentAccept, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: StripePaymentAccept, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewStripePaymentAcceptPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const StripePaymentAcceptResolvers: GQLResolvers & {
    StripePaymentAccept: Required<GQLStripePaymentAcceptResolvers>;
} = {
    StripePaymentAccept: {
        __isTypeOf: (parent) => parent instanceof StripePaymentAcceptModel,
        pk: makePrivate((parent) => StripePaymentAcceptPK.stringify(parent)),
        amount: makePrivate((parent) => parent.amount),
        currency: makePrivate((parent) => parent.currency),
        stripePaymentIntent: makePrivate((parent) => parent.stripePaymentIntent),
        stripeSessionId: makePrivate((parent) => parent.stripeSessionId),
        stripePaymentStatus: makePrivate((parent) => parent.stripePaymentStatus),
        stripeSessionObject: makePrivate((parent) => JSON.stringify(parent.stripeSessionObject)),
        createdAt: makePrivate((parent) => parent.createdAt),
        updatedAt: makePrivate((parent) => parent.updatedAt),
        status: makePrivate((parent) => parent.status),
        user: makePrivate((parent, args, context) => context.batched.User.get(UserPK.parse(parent.user))),

        /**
         * Important: This method must be idempotent. It must be safe to call
         * this more than once without adding more money to the user's balance.
         */
        async _sqsSettleStripePaymentAccept(parent, args, context) {
            const { stripePaymentStatus, stripeSessionObject, stripePaymentIntent } = args;
            enforceCalledFromSQS(context, {
                queueName: SQSQueueName.BillingQueue,
                dedupId: getSQSDedupIdForSettleStripePaymentAccept(parent),
                groupId: parent.user,
            });
            if (!(await Can.settleUserAccountActivities(context))) {
                throw new Denied();
            }
            const activity = await context.batched.AccountActivity.create({
                user: parent.user,
                amount: parent.amount,
                type: AccountActivityType.Incoming,
                reason: AccountActivityReason.Topup,
                settleAt: Date.now(),
                description: "Account top-up by you",
                stripePaymentAccept: StripePaymentAcceptPK.stringify(parent),
            });
            await settleAccountActivitiesFromSQS(context, parent.user, {
                consistentReadAccountActivities: true,
            });
            parent = await context.batched.StripePaymentAccept.update(parent, {
                stripeSessionObject: stripeSessionObject ? (JSON.parse(stripeSessionObject) as object) : undefined,
                stripePaymentStatus: stripePaymentStatus as StripePaymentAccept["stripePaymentStatus"] | undefined,
                stripePaymentIntent: stripePaymentIntent ?? undefined,
                accountActivity: AccountActivityPK.stringify(activity),
                status: StripePaymentAcceptStatus.Settled,
            });
            return parent;
        },
    },
    Query: {
        async getStripePaymentAccept(parent: {}, args, context): Promise<StripePaymentAccept> {
            const { pk } = args;
            const stripePaymentAccept = await context.batched.StripePaymentAccept.get(StripePaymentAcceptPK.parse(pk));
            if (!(await Can.getStripePaymentAccept(stripePaymentAccept, context))) {
                throw new Denied();
            }
            return stripePaymentAccept;
        },

        async getStripePaymentAcceptByStripeSessionId(parent: {}, args, context) {
            const { user, stripeSessionId } = args;
            const stripePaymentAccept = await context.batched.StripePaymentAccept.get({
                user: user,
                stripeSessionId: stripeSessionId,
            });
            if (!(await Can.getStripePaymentAcceptByStripeSessionId(stripePaymentAccept, context))) {
                throw new Denied();
            }
            return stripePaymentAccept;
        },
    },
    Mutation: {
        async createStripePaymentAccept(parent: {}, args, context) {
            const { user, amount, stripeSessionId, stripeSessionObject, stripePaymentIntent, stripePaymentStatus } =
                args;
            if (!(await Can.createStripePaymentAccept(context))) {
                throw new Denied();
            }
            const existing = await context.batched.StripePaymentAccept.getOrNull({
                user: user,
                stripeSessionId: stripeSessionId,
            });
            if (existing) {
                throw new AlreadyExists("StripePaymentAccept", { user, stripeSessionId });
            }
            const stripePaymentAccept = await context.batched.StripePaymentAccept.create({
                user,
                amount,
                stripeSessionId,
                stripeSessionObject: JSON.parse(stripeSessionObject) as object,
                stripePaymentIntent,
                stripePaymentStatus: stripePaymentStatus,
            });
            await sqsGQLClient({
                queueName: SQSQueueName.BillingQueue,
                dedupId: getSQSDedupIdForSettleStripePaymentAccept(stripePaymentAccept),
                groupId: user,
            }).mutate({
                mutation: graphql(`
                    mutation SettleStripePaymentAcceptFromSqs(
                        $pk: ID!
                        $stripePaymentStatus: String
                        $stripeSessionObject: String
                        $stripePaymentIntent: String
                    ) {
                        getStripePaymentAccept(pk: $pk) {
                            _sqsSettleStripePaymentAccept(
                                stripePaymentStatus: $stripePaymentStatus
                                stripeSessionObject: $stripeSessionObject
                                stripePaymentIntent: $stripePaymentIntent
                            ) {
                                pk
                            }
                        }
                    }
                `),
                variables: {
                    pk: StripePaymentAcceptPK.stringify(stripePaymentAccept),
                    stripePaymentStatus,
                    stripeSessionObject,
                    stripePaymentIntent,
                },
            });
            return stripePaymentAccept;
        },
    },
};
