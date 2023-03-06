import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { AlreadyExists } from "../errors";
import { StripePaymentAccept, User } from "../dynamoose/models";
import { stripePaymentAcceptResolvers } from "../resolvers/payment";
import { getUserBalance } from "../functions/account";
import Decimal from "decimal.js-light";
import { AccountActivityPK } from "../pks/AccountActivityPK";
import { stripeTransferResolvers } from "../resolvers/transfer";
import { GraphQLResolveInfo } from "graphql";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
};
// jest.retryTimes(2);
describe("Payout API", () => {
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

    test("Add monty to the account", async () => {
        let stripePaymentAccept = (await stripePaymentAcceptResolvers.Mutation!
            .createStripePaymentAccept!(
            {},
            {
                user: user.email,
                amount: "100",
                currency: "usd",
                stripePaymentStatus: "paid",
                stripeSessionId: "test",
                stripePaymentIntent: "test",
                stripeSessionObject: "{}",
            },
            context,
            {} as GraphQLResolveInfo
        ))!;

        await stripePaymentAcceptResolvers.StripePaymentAccept.settlePayment(
            stripePaymentAccept,
            { stripeSessionObject: "{}" },
            context,
            {} as GraphQLResolveInfo
        );
    });

    test("Withdraw the money", async () => {
        let balanceBefore = new Decimal(
            await getUserBalance(context, user.email)
        );
        let transfer = await stripeTransferResolvers.Mutation
            ?.createStripeTransfer!(
            {},
            {
                receiver: user.email,
                withdrawAmount: "100",
                receiveAmount: "75",
                currency: "usd",
            },
            context,
            {} as GraphQLResolveInfo
        );

        transfer =
            await stripeTransferResolvers.StripeTransfer.settleStripeTransfer(
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

        let feeActivity = await context.batched.AccountActivity.get(
            AccountActivityPK.parse(transfer.feeActivity)
        );
        expect(feeActivity.type).toEqual("credit");
        expect(feeActivity.amount).toEqual("25");
        expect(feeActivity.status).toEqual("settled");

        // Examine new balance
        let balanceAfter = new Decimal(
            await getUserBalance(context, user.email, {
                refresh: true,
                // consistent: true,
            })
        );

        expect(balanceAfter.toString()).toEqual(
            balanceBefore.minus(100).toString()
        );
    });
});
