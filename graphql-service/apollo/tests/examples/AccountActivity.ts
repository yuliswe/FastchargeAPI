import { RequestContext } from "@/RequestContext";
import { AccountActivityReason, AccountActivityStatus, AccountActivityType } from "@/__generated__/resolvers-types";
import { AccountActivityCreateProps } from "@/database/models/AccountActivity";
import { UserPK } from "@/pks/UserPK";
import { createTestUser } from "./User";

export async function createTestAccountActivity(
    context: RequestContext,
    overwrite?: Partial<AccountActivityCreateProps>
) {
    const { user } = overwrite ?? {};
    return context.batched.AccountActivity.create({
        user: user ?? UserPK.stringify(await createTestUser(context)),
        type: AccountActivityType.Incoming,
        reason: AccountActivityReason.ApiMinMonthlyCharge,
        settleAt: Date.now(),
        status: AccountActivityStatus.Pending,
        amount: "0",
        billedApp: null,
        usageSummary: null,
        stripeTransfer: null,
        consumedFreeQuota: 0,
        ...overwrite,
    });
}
