import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { StripePaymentAccept, User } from "../dynamoose/models";
import { stripePaymentAcceptResolvers } from "../resolvers/payment";
import { getUserBalance } from "../functions/account";
import Decimal from "decimal.js-light";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { GQLUserIndex } from "../__generated__/resolvers-types";
import { UserPK } from "../pks/UserPK";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: true,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Payment API", () => {
    let user: User;
    test("Preparation: get test user 1", async () => {
        user = await context.batched.User.get(
            { email: "testuser1.fastchargeapi@gmail.com" },
            { using: GQLUserIndex.IndexByEmailOnlyPk }
        );
        expect(user).not.toBe(null);
    });

    let stripePaymentAccept: StripePaymentAccept;
    test("Create a StripePayment", async () => {
        stripePaymentAccept = await context.batched.StripePaymentAccept.create({
            user: UserPK.stringify(user),
            amount: "1",
            currency: "usd",
            stripePaymentStatus: "paid",
            stripeSessionId: "test",
            stripePaymentIntent: "test",
            stripeSessionObject: {},
        });
        expect(stripePaymentAccept).not.toBe(null);
    });

    test("Settle the payment", async () => {
        let oldBalance = new Decimal(await getUserBalance(context, UserPK.stringify(user!)));
        stripePaymentAccept = (await stripePaymentAcceptResolvers.StripePaymentAccept.settlePayment(
            stripePaymentAccept,
            { stripeSessionObject: "{}" },
            context,
            {} as never
        ))!;
        expect(stripePaymentAccept).not.toBe(null);
        expect(stripePaymentAccept.accountActivity).not.toBe(null);
        expect(stripePaymentAccept.accountActivity.length).not.toBe(0);

        context.batched.AccountHistory.clearCache();
        let newBalance = new Decimal(await getUserBalance(context, UserPK.stringify(user!)));
        expect(newBalance).toEqual(oldBalance.plus(1));

        // Examine the account activity
        let accountActivity = await context.batched.AccountActivity.get(
            AccountActivityPK.parse(stripePaymentAccept.accountActivity)
        );
        expect(accountActivity.reason).toBe("topup");
        expect(accountActivity.type).toBe("debit");
        expect(accountActivity.amount).toBe("1");
        expect(accountActivity.description).toMatch(/top-up/i);
    });
});
