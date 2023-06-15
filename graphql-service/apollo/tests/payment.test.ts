import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { StripePaymentAccept, User } from "../dynamoose/models";
import { stripePaymentAcceptResolvers } from "../resolvers/payment";
import { getUserBalance } from "../functions/account";
import Decimal from "decimal.js-light";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { UserPK } from "../pks/UserPK";
import { v4 as uuidv4 } from "uuid";
import { getOrCreateTestUser } from "./test-utils";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Payment API", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    test("Preparation: get test user 1", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });

    let stripePaymentAccept: StripePaymentAccept;
    test("Create a StripePayment", async () => {
        stripePaymentAccept = await context.batched.StripePaymentAccept.create({
            user: UserPK.stringify(testUser),
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
        const oldBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
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
        const newBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
        expect(newBalance).toEqual(oldBalance.plus(1));

        // Examine the account activity
        const accountActivity = await context.batched.AccountActivity.get(
            AccountActivityPK.parse(stripePaymentAccept.accountActivity)
        );
        expect(accountActivity.reason).toBe("topup");
        expect(accountActivity.type).toBe("debit");
        expect(accountActivity.amount).toBe("1");
        expect(accountActivity.description).toMatch(/top-up/i);
    });
});
