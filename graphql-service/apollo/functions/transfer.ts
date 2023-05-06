import Decimal from "decimal.js-light";
import { RequestContext } from "../RequestContext";
import { AccountActivity, StripeTransfer } from "../dynamoose/models";
import { BadInput } from "../errors";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { getUserBalance, settleAccountActivities } from "./account";
import { StripeTransferPK } from "../pks/StripeTransferPK";

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
    let userBalance = new Decimal(await getUserBalance(context, transfer.receiver));
    if (userBalance.lessThan(transfer.withdrawAmount)) {
        throw new BadInput("User's account has insufficient funds to complete the transfer.");
    }
    let transferFee = new Decimal(transfer.withdrawAmount).sub(transfer.receiveAmount);
    if (transferFee.lessThan(0)) {
        throw new BadInput("The receive amount cannot be greater than the withdraw amount.");
    }
    let settleAt = Date.now();
    let activity = await context.batched.AccountActivity.create({
        user: userPK,
        amount: transfer.receiveAmount,
        type: "credit",
        reason: "payout",
        settleAt: settleAt - 1, // set in the past so it's settled immediately
        description: `Payment to your Stripe account`,
        stripeTransfer: StripeTransferPK.stringify(transfer),
    });
    let feeActivity = await context.batched.AccountActivity.create({
        user: userPK,
        amount: transferFee.toString(),
        type: "credit",
        reason: "payout_fee",
        settleAt: settleAt - 2, // Set in the past so it's settled immediately. Use a different time
        // because settleAt is a range key and must be unique.
        description: `Stripe service fee`,
        stripeTransfer: StripeTransferPK.stringify(transfer),
    });
    await settleAccountActivities(context, userPK, {
        consistentReadAccountActivities: true,
    });
    transfer.accountActivity = AccountActivityPK.stringify(activity);
    transfer.feeActivity = AccountActivityPK.stringify(feeActivity);
    await transfer.save();

    // refresh the account activities
    context.batched.AccountActivity.clearCache();
    activity = await context.batched.AccountActivity.get(AccountActivityPK.extract(activity), {
        consistent: true,
    });
    feeActivity = await context.batched.AccountActivity.get(AccountActivityPK.extract(activity), {
        consistent: true,
    });
    return {
        accountActivity: activity,
        feeActivity: feeActivity,
    };
}
