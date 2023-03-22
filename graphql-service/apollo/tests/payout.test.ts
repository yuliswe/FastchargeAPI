import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { User } from "../dynamoose/models";
import { getUserBalance } from "../functions/account";
import Decimal from "decimal.js-light";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { stripeTransferResolvers } from "../resolvers/transfer";
import { GraphQLResolveInfo } from "graphql";
import { UserPK } from "../pks/UserPK";
import { addMoneyForUser, getOrCreateTestUser } from "./test-utils";
import { v4 as uuidv4 } from "uuid";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Payout API", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    test("Preparation: get test user 1", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });

    test("Prepration: Add monty to the account", async () => {
        await addMoneyForUser(context, { user: UserPK.stringify(testUser), amount: "100" });
    });

    test("Test: Withdraw the money", async () => {
        let balanceBefore = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
        let transfer = await stripeTransferResolvers.Mutation?.createStripeTransfer!(
            {},
            {
                receiver: UserPK.stringify(testUser),
                withdrawAmount: "100",
                receiveAmount: "75",
                currency: "usd",
            },
            context,
            {} as GraphQLResolveInfo
        );

        transfer = await stripeTransferResolvers.StripeTransfer.settleStripeTransfer(
            transfer!,
            {},
            context,
            {} as GraphQLResolveInfo
        );

        expect(transfer.accountActivity).not.toBe(null);
        expect(transfer.feeActivity).not.toBe(null);

        // Examine the account activity
        let accountActivity = await context.batched.AccountActivity.get(
            AccountActivityPK.parse(transfer.accountActivity)
        );
        expect(accountActivity.type).toEqual("credit");
        expect(accountActivity.amount).toEqual("75");
        expect(accountActivity.status).toEqual("settled");

        let feeActivity = await context.batched.AccountActivity.get(AccountActivityPK.parse(transfer.feeActivity));
        expect(feeActivity.type).toEqual("credit");
        expect(feeActivity.amount).toEqual("25");
        expect(feeActivity.status).toEqual("settled");

        // Examine new balance
        let balanceAfter = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));

        expect(balanceAfter.toString()).toEqual(balanceBefore.minus(100).toString());
    });
});
