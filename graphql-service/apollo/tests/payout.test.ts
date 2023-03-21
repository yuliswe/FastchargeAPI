import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { User } from "../dynamoose/models";
import { getUserBalance } from "../functions/account";
import Decimal from "decimal.js-light";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { stripeTransferResolvers } from "../resolvers/transfer";
import { GraphQLResolveInfo } from "graphql";
import { GQLUserIndex } from "../__generated__/resolvers-types";
import { UserPK } from "../pks/UserPK";
import { addMoneyForUser } from "./test-utils/account";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Payout API", () => {
    let user: User;
    test("Preparation: get test user 1", async () => {
        user = await context.batched.User.get(
            { email: "testuser1.fastchargeapi@gmail.com" },
            { using: GQLUserIndex.IndexByEmailOnlyPk }
        );
        expect(user).not.toBe(null);
    });

    test("Prepration: Add monty to the account", async () => {
        await addMoneyForUser(context, { user: UserPK.stringify(user), amount: "100" });
    });

    test("Test: Withdraw the money", async () => {
        let balanceBefore = new Decimal(await getUserBalance(context, UserPK.stringify(user)));
        let transfer = await stripeTransferResolvers.Mutation?.createStripeTransfer!(
            {},
            {
                receiver: UserPK.stringify(user),
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
        let balanceAfter = new Decimal(await getUserBalance(context, UserPK.stringify(user)));

        expect(balanceAfter.toString()).toEqual(balanceBefore.minus(100).toString());
    });
});
