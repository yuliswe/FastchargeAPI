import { mockSQS } from "@/MockSQS";
import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import assert from "assert";
import { Decimal } from "decimal.js-light";
import { RequestContext, UserPK, createDefaultContextBatched, getUserBalance } from "graphql-service";
import { StripeTransfer, User } from "graphql-service/dynamoose/models";
import { AccountActivityPK } from "graphql-service/pks/AccountActivityPK";
import { addMoneyForUser, getOrCreateTestUser } from "graphql-service/tests/test-utils";
import { v4 as uuidv4 } from "uuid";
import { handle as CreateStripeTransfer } from "../handlers/CreateStripeTransfer";
import { makeCreateStripeTransferLambdaEvent } from "./sample-data/CreateStripeTransfer";

const testScale = Number.parseInt(process.env.TEST_SCALE || "1");
const testSize = 20 * testScale;

jest.setTimeout(120_000);
jest.retryTimes(3, { logErrorsBeforeRetry: true });

const context: RequestContext = {
    service: "payment",
    isServiceRequest: true,
    isSQSMessage: true,
    batched: createDefaultContextBatched(),
    isAnonymousUser: false,
    isAdminUser: false,
};

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

describe("Test a succesful withdraw to Stripe", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;
    let userBalance: Decimal;
    let response: PromiseType<ReturnType<typeof CreateStripeTransfer>>;

    beforeAll(async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });

        await addMoneyForUser(context, { user: UserPK.stringify(testUser), amount: "3" });
        await mockSQS.waitForQueuesToEmpty();

        userBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
        assert.equal(userBalance.toNumber(), 3);

        response = await CreateStripeTransfer(
            makeCreateStripeTransferLambdaEvent({
                userPK: UserPK.stringify(testUser),
                body: JSON.stringify({
                    withdraw: "3",
                }),
            })
        );

        assert.equal(response.statusCode, 200);
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
        const accountActivity = await context.batched.AccountActivity.get(
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
    let userBalance: Decimal;

    const withdrawlAmount = "3";
    const requiredBalance = new Decimal(testSize).times(withdrawlAmount);

    beforeAll(async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });

        console.log(`Before start, the test user should have a minimum of ${requiredBalance.toString()}`);
        await addMoneyForUser(context, { user: UserPK.stringify(testUser), amount: requiredBalance.toString() });
        userBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));

        if (userBalance.lt(requiredBalance)) {
            throw new Error(`Test user does not have enough money to run the test. ${userBalance.toString()}`);
        }

        if (process.env.LOCAL_SQS === "1") {
            console.log(`Withdraw ${testSize} times synchronously (due to LOCAL_SQS=1)`);
        } else {
            console.log(`Withdraw ${testSize} times asynchronously`);
        }
        const batchSize = 10;
        async function doBatch(size: number) {
            const promises = [];
            for (let j = 0; j < size; j++) {
                const p = CreateStripeTransfer(
                    makeCreateStripeTransferLambdaEvent({
                        userPK: UserPK.stringify(testUser),
                        body: JSON.stringify({
                            withdraw: "3",
                        }),
                    })
                );
                promises.push(p);
            }
            if (process.env.LOCAL_SQS === "1") {
                await mockSQS.waitForQueuesToEmpty();
            }
            for await (const response of promises) {
                assert(response.statusCode === 200);
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
