import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { User } from "@/database/models/User";
import { getUserBalance } from "@/functions/account";
import { AccountActivityPK } from "@/pks/AccountActivityPK";
import { UserPK } from "@/pks/UserPK";
import { StripeTransferResolvers } from "@/resolvers/StripeTransfer";
import { addMoneyForUser, getOrCreateTestUser } from "@/tests/test-utils";
import { GraphQLResolveInfoWithCacheControl } from "@apollo/cache-control-types";
import { describe, expect, test } from "@jest/globals";
import Decimal from "decimal.js-light";
import { v4 as uuidv4 } from "uuid";

describe("Payout API", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    const context: RequestContext = {
        batched: createDefaultContextBatched(),
        isServiceRequest: true,
        isSQSMessage: true,
        isAnonymousUser: false,
        isAdminUser: false,
    };

    test("Preparation: get test user 1", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
        context.sqsMessageGroupId = UserPK.stringify(testUser);
    });

    test("Prepration: Add monty to the account", async () => {
        await addMoneyForUser({ user: UserPK.stringify(testUser), amount: "100", context });
    });

    test("Test: Withdraw the money", async () => {
        const balanceBefore = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
        let transfer = (await StripeTransferResolvers.Mutation?.createStripeTransfer!(
            {},
            {
                receiver: UserPK.stringify(testUser),
                withdrawAmount: "100",
            },
            context,
            {} as GraphQLResolveInfoWithCacheControl
        ))!;

        transfer = await StripeTransferResolvers.StripeTransfer.settleStripeTransfer(
            transfer,
            {},
            context,
            {} as GraphQLResolveInfoWithCacheControl
        );

        expect(transfer.accountActivity).not.toBe(null);
        expect(transfer.feeActivity).not.toBe(null);

        // Examine the account activity
        const accountActivity = await context.batched.AccountActivity.get(
            AccountActivityPK.parse(transfer.accountActivity)
        );
        expect(accountActivity.type).toEqual("credit");
        expect(accountActivity.amount).toEqual("75");
        expect(accountActivity.status).toEqual("settled");

        const feeActivity = await context.batched.AccountActivity.get(AccountActivityPK.parse(transfer.feeActivity));
        expect(feeActivity.type).toEqual("credit");
        expect(feeActivity.amount).toEqual("25");
        expect(feeActivity.status).toEqual("settled");

        // Examine new balance
        const balanceAfter = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));

        expect(balanceAfter.toString()).toEqual(balanceBefore.minus(100).toString());
    });
});
