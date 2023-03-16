import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { AlreadyExists } from "../errors";
import { StripePaymentAccept, User } from "../dynamoose/models";
import { stripePaymentAcceptResolvers } from "../resolvers/payment";
import { getUserBalance } from "../functions/account";
import Decimal from "decimal.js-light";
import { AccountActivityPK } from "../pks/AccountActivityPK";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: true,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Payment API", () => {
    let user: User;
    test("create a User", async () => {
        try {
            user = await context.batched.User.create({
                email: "testuser1.fastchargeapi@gmail.com",
            });
        } catch (e) {
            if (e instanceof AlreadyExists) {
                user = await context.batched.User.get({
                    email: "testuser1.fastchargeapi@gmail.com",
                });
            } else {
                throw e;
            }
        }
        expect(user).not.toBe(null);
    });

    let stripePaymentAccept: StripePaymentAccept;
    test("Create a StripePayment", async () => {
        stripePaymentAccept = (await stripePaymentAcceptResolvers.Mutation!.createStripePaymentAccept!(
            {},
            {
                user: user.email,
                amount: "1",
                currency: "usd",
                stripePaymentStatus: "paid",
                stripeSessionId: "test",
                stripePaymentIntent: "test",
                stripeSessionObject: "{}",
            },
            context,
            {} as any
        ))!;
        expect(stripePaymentAccept).not.toBe(null);
    });

    test("Settle the payment", async () => {
        let oldBalance = new Decimal(await getUserBalance(context, user!.email));
        stripePaymentAccept = (await stripePaymentAcceptResolvers.StripePaymentAccept.settlePayment(
            stripePaymentAccept,
            { stripeSessionObject: "{}" },
            context,
            {} as any
        ))!;
        expect(stripePaymentAccept).not.toBe(null);
        expect(stripePaymentAccept.accountActivity).not.toBe(null);
        expect(stripePaymentAccept.accountActivity.length).not.toBe(0);

        context.batched.AccountHistory.clearCache();
        let newBalance = new Decimal(await getUserBalance(context, user!.email));
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
