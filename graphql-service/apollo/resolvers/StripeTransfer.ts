import { StripeTransfer, StripeTransferModel } from "@/database/models/StripeTransfer";
import { getRecivableAmountForWithdrawal } from "@/functions/fees";
import { SQSQueueName, getSQSClient } from "@/sqsClient";
import { graphql } from "@/typed-graphql";
import Decimal from "decimal.js-light";
import { RequestContext } from "../RequestContext";
import {
  GQLMutationCreateStripeTransferArgs,
  GQLQueryGetStripeTransferArgs,
  GQLResolvers,
  GQLStripeTransferResolvers,
  StripeTransferStatus,
} from "../__generated__/resolvers-types";
import { BadInput, Denied } from "../errors";
import { getUserBalance, sqsSettleAccountActivities } from "../functions/account";
import { enforceCalledFromSQS } from "../functions/aws";
import { createAccountActivitiesForTransfer, getSQSDedupIdForSettleStripeTransfer } from "../functions/transfer";
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
    receiver: makePrivate((parent, args, context) => context.batched.User.get(UserPK.parse(parent.receiver))),

    /**
     * A StripeTransfer happens when the user withdraws money from their
     * account. Calling this method creates an AccountActivity for the user,
     * substracting the withdrawl amount from their balance.
     */
    async _sqsSettleStripeTransfer(parent: StripeTransfer, args: {}, context: RequestContext): Promise<StripeTransfer> {
      enforceCalledFromSQS(context, {
        groupId: parent.receiver,
        queueName: SQSQueueName.BillingQueue,
        dedupId: getSQSDedupIdForSettleStripeTransfer(parent),
      });
      if (!(await Can.settleUserAccountActivities(context))) {
        throw new Denied();
      }
      const balance = await getUserBalance(context, parent.receiver);
      if (new Decimal(balance).lessThan(parent.withdrawAmount)) {
        return context.batched.StripeTransfer.update(parent, {
          status: StripeTransferStatus.FailedDueToInsufficientBalance,
        });
      }
      const user = await context.batched.User.get(UserPK.parse(parent.receiver));
      await createAccountActivitiesForTransfer(context, {
        transfer: parent,
        userPK: UserPK.stringify(user),
      });
      await sqsSettleAccountActivities(context, parent.receiver, {
        consistentReadAccountActivities: true,
      });
      return await context.batched.StripeTransfer.update(parent, {
        status: StripeTransferStatus.PendingTransfer,
      });
    },
  },
  Query: {
    async getStripeTransfer(
      parent: {},
      { pk }: GQLQueryGetStripeTransferArgs,
      context: RequestContext
    ): Promise<StripeTransfer> {
      const transfer = await context.batched.StripeTransfer.get(StripeTransferPK.parse(pk));
      if (!(await Can.getStripeTransfer(transfer, context))) {
        throw new Denied();
      }
      return transfer;
    },
  },
  Mutation: {
    async createStripeTransfer(
      parent,
      { receiver, withdrawAmount }: GQLMutationCreateStripeTransferArgs,
      context: RequestContext
    ) {
      if (!(await Can.createStripeTransfer({ receiver }, context))) {
        throw new Denied();
      }
      const withdrawAmountDecimal = new Decimal(withdrawAmount);
      const balance = await getUserBalance(context, receiver);
      if (new Decimal(balance).lessThan(withdrawAmount)) {
        throw new BadInput(`User does not have enough balance to withdraw ${withdrawAmount}`);
      }
      const { receivable, totalFee } = await getRecivableAmountForWithdrawal(withdrawAmountDecimal, context);
      if (receivable.lessThanOrEqualTo(0)) {
        throw new BadInput(
          `Unable to withdraw due to total transfer fee being ${totalFee.toString()}. ` +
            "This means that after paying the transfer fees, the user will not receive any money."
        );
      }
      const stripeTransfer = await context.batched.StripeTransfer.create({
        receiver,
        withdrawAmount,
        receiveAmount: receivable.toString(),
        transferAt: Date.now() + 1000 * 60 * 60 * 24, // Transfer after 24 hours
        status: StripeTransferStatus.Created,
      });
      await getSQSClient({
        queueName: SQSQueueName.BillingQueue,
        groupId: receiver,
        dedupId: getSQSDedupIdForSettleStripeTransfer(stripeTransfer),
      }).mutate({
        mutation: graphql(`
          mutation SettleStripeTransferFromSQS($pk: ID!) {
            getStripeTransfer(pk: $pk) {
              _sqsSettleStripeTransfer {
                pk
                status
              }
            }
          }
        `),
        variables: { pk: StripeTransferPK.stringify(stripeTransfer) },
      });
      return stripeTransfer;
    },
  },
};

/* Deprecated */
StripeTransferResolvers.Query!.stripeTransfer = StripeTransferResolvers.Query!.getStripeTransfer!;
