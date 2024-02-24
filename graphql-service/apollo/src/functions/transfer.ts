import { RequestContext } from "@/src/RequestContext";
import { AccountActivityReason, AccountActivityType } from "@/src/__generated__/resolvers-types";
import { AccountActivity } from "@/src/database/models/AccountActivity";
import { StripeTransfer } from "@/src/database/models/StripeTransfer";
import { BadInput } from "@/src/errors";
import { enforceCalledFromSQS } from "@/src/functions/aws";
import { AccountActivityPK } from "@/src/pks/AccountActivityPK";
import { StripeTransferPK } from "@/src/pks/StripeTransferPK";
import { SQSQueueName } from "@/src/sqsClient";
import Decimal from "decimal.js-light";

/**
 * Takes a StripeTransfer, and create AccountActivities for the transfer,
 * including the amount being withdrawn, and the fee being charged. The two
 * AccountActivities are settled immediately.
 * @param context
 * @param param1
 * @returns
 */
export async function createAccountActivitiesForTransfer(
  context: RequestContext,
  {
    transfer,
    userPK,
  }: {
    transfer: StripeTransfer;
    userPK: string;
  }
): Promise<{
  accountActivity: AccountActivity;
  feeActivity: AccountActivity;
}> {
  enforceCalledFromSQS(context, {
    queueName: SQSQueueName.BillingQueue,
    groupId: userPK,
  });
  const transferFee = new Decimal(transfer.withdrawAmount).sub(transfer.receiveAmount);
  if (transferFee.lessThan(0)) {
    throw new BadInput("The receive amount cannot be greater than the withdraw amount.");
  }
  const settleAt = Date.now();
  const payoutActivity = await context.batched.AccountActivity.create({
    user: userPK,
    amount: transfer.receiveAmount,
    type: AccountActivityType.Outgoing,
    reason: AccountActivityReason.Payout,
    settleAt: settleAt - 1, // set in the past so it's settled immediately
    description: `Payment to your Stripe account`,
    stripeTransfer: StripeTransferPK.stringify(transfer),
  });
  const feeActivity = await context.batched.AccountActivity.create({
    user: userPK,
    amount: transferFee.toString(),
    type: AccountActivityType.Outgoing,
    reason: AccountActivityReason.PayoutFee,
    settleAt: settleAt - 2, // Set in the past so it's settled immediately. Use a different time
    // because settleAt is a range key and must be unique.
    description: `Stripe service fee`,
    stripeTransfer: StripeTransferPK.stringify(transfer),
  });
  transfer.accountActivity = AccountActivityPK.stringify(payoutActivity);
  transfer.feeActivity = AccountActivityPK.stringify(feeActivity);
  await transfer.save();
  return {
    accountActivity: payoutActivity,
    feeActivity,
  };
}

export function getSQSDedupIdForSettleStripeTransfer(stripeTransfer: StripeTransfer) {
  return ("settleStripeTransfer-" + StripeTransferPK.stringify(stripeTransfer)).slice(0, 128);
}
