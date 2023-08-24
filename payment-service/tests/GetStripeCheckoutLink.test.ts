import { describe, expect, jest, test } from "@jest/globals";
import { UserPK, createDefaultContextBatched } from "graphql-service";
import { RequestContext } from "graphql-service/RequestContext";
import { User } from "graphql-service/dynamoose/models";
import { getOrCreateTestUser } from "graphql-service/tests/test-utils";
import { v4 as uuidv4 } from "uuid";
import { handle as Checkout } from "../handlers/GetStripeCheckoutLink";
import { makeGetStripeCheckoutLinkLambdaEvent } from "./sample-data/GetStripeCheckoutLink";

jest.setTimeout(60_000);
jest.retryTimes(3, { logErrorsBeforeRetry: true });

const context: RequestContext = {
    service: "payment",
    isServiceRequest: true,
    isSQSMessage: true,
    batched: createDefaultContextBatched(),
    isAnonymousUser: false,
    isAdminUser: false,
};

describe("Create a Stripe checkout session", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    beforeAll(async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });

    test("A successful topup", async () => {
        const response = await Checkout(
            makeGetStripeCheckoutLinkLambdaEvent({
                userPK: UserPK.stringify(testUser),
                body: JSON.stringify({
                    successUrl: "https://fastchargeapi.com/topup?success=true",
                    cancelUrl: "https://fastchargeapi.com/topup?cancel=true",
                    amount: "1000",
                }),
            }),
            { skipBalanceCheck: true }
        );
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body!);
        expect(body).toHaveProperty("location");
        expect(body.location).toMatch(/^https:\/\/checkout.stripe.com/);
    });

    test("A topup with less than $1", async () => {
        const response = await Checkout(
            makeGetStripeCheckoutLinkLambdaEvent({
                userPK: UserPK.stringify(testUser),
                body: JSON.stringify({
                    successUrl: "https://fastchargeapi.com/topup?success=true",
                    cancelUrl: "https://fastchargeapi.com/topup?cancel=true",
                    amount: "0.99",
                }),
            })
        );
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body!);
        expect(body.error).toMatch(/.*at least \$1.*/);
    });

    test("A topup with more than $100", async () => {
        const response = await Checkout(
            makeGetStripeCheckoutLinkLambdaEvent({
                userPK: UserPK.stringify(testUser),
                body: JSON.stringify({
                    successUrl: "https://fastchargeapi.com/topup?success=true",
                    cancelUrl: "https://fastchargeapi.com/topup?cancel=true",
                    amount: "100.01",
                }),
            })
        );
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body!);
        expect(body.error).toMatch(/.*exceed.+limit.*/);
    });
});
