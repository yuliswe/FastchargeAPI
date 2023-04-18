import { describe, expect, jest, test } from "@jest/globals";
import { Decimal } from "decimal.js-light";
import { RequestContext, UserPK, createDefaultContextBatched, getUserBalance } from "graphql-service";
import { StripeTransfer, User } from "graphql-service/dynamoose/models";
import { AccountActivityPK } from "graphql-service/pks/AccountActivityPK";
import { addMoneyForUser, getOrCreateTestUser } from "graphql-service/tests/test-utils";
import { LambdaEventV2 } from "utils/LambdaContext";
import { v4 as uuidv4 } from "uuid";
import { handle as CreateStripeTransfer } from "../handlers/CreateStripeTransfer";

const testScale = Number.parseInt(process.env.TEST_SCALE || "1");
const testSize = 20 * testScale;

jest.setTimeout(60_000);

export const context: RequestContext = {
    service: "payment",
    isServiceRequest: true,
    isSQSMessage: true,
    batched: createDefaultContextBatched(),
};

function makeLambdaEvent({ userPK, body }: { userPK: string; body: string }): LambdaEventV2 {
    return {
        version: "2.0",
        routeKey: "POST /accept-payment",
        rawPath: "/accept-payment",
        rawQueryString: "",
        headers: {
            accept: "*/*; q=0.5, application/xml",
            "accept-encoding": "gzip",
            "cache-control": "no-cache",
            "content-length": "3513",
            "content-type": "application/json; charset=utf-8",
            host: "api.v2.payment.fastchargeapi.com",
            "stripe-signature":
                "t=1678780438,v1=fb6de4205abb8029c7ab92f14b259189a98786a0a7587edb068e5b4791c927d0,v0=b51edf9067d16b92d1378db7cff793d06e5ceb576b0357caf9b9f6d8890c4609",
            "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
            "x-amzn-trace-id": "Root=1-64102816-07688b1e117da0152f43d994",
            "x-forwarded-for": "72.136.80.113",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https",
        },
        requestContext: {
            accountId: "887279901853",
            apiId: "pngsxpq63k",
            domainName: "api.v2.payment.fastchargeapi.com",
            domainPrefix: "api",
            authorizer: {
                lambda: {
                    userPK,
                },
            },
            http: {
                method: "POST",
                path: "/accept-payment",
                protocol: "HTTP/1.1",
                sourceIp: "72.136.80.113",
                userAgent: "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
            },
            requestId: uuidv4(),
            routeKey: "POST /accept-payment",
            stage: "$default",
            time: "14/Mar/2023:07:53:58 +0000",
            timeEpoch: 1678780438960,
        },
        body,
        isBase64Encoded: false,
    };
}

describe("Test a succesful withdraw to Stripe", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    test("Preparation: get test user", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });

    let userBalance: Decimal;
    test("Before start, the test user should have a minimum of $3", async () => {
        await addMoneyForUser(context, { user: UserPK.stringify(testUser), amount: "3" });
        userBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
        expect(userBalance.gte("3")).toBeTruthy();
    });

    test("Create a StripeTransfer via SQS", async () => {
        let response = await CreateStripeTransfer(
            makeLambdaEvent({
                userPK: UserPK.stringify(testUser),
                body: JSON.stringify({
                    withdraw: "3",
                }),
            })
        );
        if (response.statusCode !== 200) {
            console.error("response", response.body);
        }
        expect(response.statusCode).toBe(200);
    });

    test("Check that the StripeTransfer was created", async () => {
        let count = 0;
        for (let i = 0; i < 5; i++) {
            console.log(`Waiting for SQS to create the StripeTransfer object. (${i * 10}s)`);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            count = await context.batched.StripeTransfer.count({
                receiver: UserPK.stringify(testUser),
            });
            if (count > 0) {
                break;
            }
        }
        expect(count).toEqual(1);
    });

    test("Check that the StripeTransfer was settled by confirming account actvities are created.", async () => {
        let stripeTransfer: StripeTransfer | undefined;
        for (let i = 0; i < 5; i++) {
            stripeTransfer = await context.batched.StripeTransfer.get({ receiver: UserPK.stringify(testUser) });
            if (stripeTransfer.accountActivity != null) {
                break;
            }
            console.log("Waiting for Stripe to settle the transfer", i);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
        }
        expect(stripeTransfer).toBeDefined();
        let accountActivity = await context.batched.AccountActivity.get(
            AccountActivityPK.parse(stripeTransfer!.accountActivity)
        );
        expect(accountActivity.status).toEqual("settled");
    });

    test("Check the users balance is reduced $1", async () => {
        // Wait for the SQS to handle the message
        let newBalance: Decimal;
        for (let i = 0; i < 5; i++) {
            console.log(`Waiting for SQS to process the messages. (${i * 10}s)`);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            context.batched.AccountHistory.clearCache();
            newBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
            if (!newBalance.eq(userBalance)) {
                break;
            }
        }
        expect(newBalance!.toString()).toEqual(userBalance.minus("3").toString());
    });
});

describe(`Test that the creation of StripeTransfer is properly queued, by making ${testSize} wihdrawl requests simultaneously. All requests should be handled.`, () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    test("Preparation: get test user", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });

    let userBalance: Decimal;
    const withdrawlAmount = "3";
    const requiredBalance = new Decimal(testSize).times(withdrawlAmount);
    test(`Before start, the test user should have a minimum of ${requiredBalance.toString()}`, async () => {
        await addMoneyForUser(context, { user: UserPK.stringify(testUser), amount: requiredBalance.toString() });
        userBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
        expect(userBalance.gte(requiredBalance)).toBeTruthy();
    });

    test(`Withdraw ${testSize} times asynchronously`, async () => {
        const batchSize = 10;
        async function doBatch(size: number) {
            let promises = [];
            for (let j = 0; j < size; j++) {
                let p = CreateStripeTransfer(
                    makeLambdaEvent({
                        userPK: UserPK.stringify(testUser),
                        body: JSON.stringify({
                            withdraw: "3",
                        }),
                    })
                );
                promises.push(p);
            }
            for await (let response of promises) {
                if (response.statusCode !== 200) {
                    console.error("response", response.body);
                }
                expect(response.statusCode).toBe(200);
            }
        }
        let i = batchSize;
        while (i <= testSize) {
            await doBatch(batchSize);
            i += batchSize;
        }
        await doBatch(testSize % batchSize);
    });

    test(`Check that ${testSize} StripeTransfer objects were created`, async () => {
        let count = 0;
        for (let i = 0; i < 10 * testScale; i++) {
            console.log(`Waiting for SQS to create ${testSize} StripeTransfer objects. (${i * 10}s)`);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            count = await context.batched.StripeTransfer.count({ receiver: UserPK.stringify(testUser) });
            if (count >= testSize) {
                break;
            }
        }
        expect(count).toEqual(testSize);
    });

    test("Check the users balance is reduced $60", async () => {
        // Wait for the SQS to handle the message
        let newBalance: Decimal;
        for (let i = 0; i < 5; i++) {
            console.log(`Waiting for SQS to process the messages. (${i * 10}s)`);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            context.batched.AccountHistory.clearCache();
            newBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
            if (!newBalance.eq(userBalance)) {
                break;
            }
        }
        expect(newBalance!.toString()).toEqual(userBalance.minus(requiredBalance).toString());
    });
});
