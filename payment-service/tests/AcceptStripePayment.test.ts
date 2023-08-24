import { mockSQS } from "@/MockSQS";
import { describe, expect, jest, test } from "@jest/globals";
import assert from "assert";
import { RequestContext, UserPK, createDefaultContextBatched } from "graphql-service";
import { User } from "graphql-service/dynamoose/models";
import { getOrCreateTestUser } from "graphql-service/tests/test-utils";
import stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { handle as AcceptPayment, StripeSessionObject } from "../handlers/AcceptStripePayment";
import { makeAcceptStripePaymentLambdaEvent } from "./sample-data/AcceptStripePayment";

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

describe("Test create order and fulfill immediately", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    beforeAll(async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });

        console.log(
            "A checkout.session.completed event where payment_status === 'paid'" +
                " should create an StripePaymentAccept object in the SQS, and settle it immediately"
        );
        await AcceptPayment(
            makeAcceptStripePaymentLambdaEvent({
                userPK: UserPK.stringify(testUser),
                userEmail: testUserEmail,
            }),
            {
                parseStripeEvent: (result) => {
                    const stripeEvent: stripe.Event = JSON.parse(result.body!);
                    stripeEvent.type = "checkout.session.completed";
                    const sessionObject: StripeSessionObject = {
                        ...(stripeEvent.data.object as StripeSessionObject),
                        payment_status: "paid",
                        id: uuidv4(),
                    };
                    stripeEvent.data.object = sessionObject;
                    return stripeEvent;
                },
            }
        );
        // Wait for SQS to process the messages. Increase the timeout if this fails.
        let newCount = 0;
        for (let i = 0; i < 5 * testScale; i++) {
            console.log(`Waiting for SQS to process the messages. (${i * 10}s)`);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            newCount = await context.batched.StripePaymentAccept.count({ user: UserPK.stringify(testUser) });
            if (newCount > 0) {
                break;
            }
        }

        assert.notEqual(newCount, 0);
    });

    test("The StripePaymentAccept object should be settled", async () => {
        const newPaymentAccept = await context.batched.StripePaymentAccept.get({
            user: UserPK.stringify(testUser),
        });
        expect(newPaymentAccept).not.toBeNull();
        expect(newPaymentAccept.status).toBe("settled");
    });
});

describe("Test AcceptPayment is idempotent by invoking the handler with the same checkout session id. Only one should be accepted.", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    beforeAll(async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
        console.log(`Call lambdaHandler asynchronosuly ${testSize} times with the same stripe session ID`);
        const batchSize = 10;
        const sessionId = uuidv4();
        async function doBatch(size: number) {
            const promises = [];
            for (let i = 0; i < size; i++) {
                const p = AcceptPayment(
                    makeAcceptStripePaymentLambdaEvent({
                        userPK: UserPK.stringify(testUser),
                        userEmail: testUserEmail,
                    }),
                    {
                        parseStripeEvent: (result) => {
                            const stripeEvent: stripe.Event = JSON.parse(result.body!);
                            stripeEvent.type = "checkout.session.completed";
                            const sessionObject: StripeSessionObject = {
                                ...(stripeEvent.data.object as StripeSessionObject),
                                id: sessionId,
                                payment_status: "paid",
                            };
                            stripeEvent.data.object = sessionObject;
                            return stripeEvent;
                        },
                    }
                );
                promises.push(p);
            }
            if (process.env.LOCAL_SQS === "1") {
                await mockSQS.waitForQueuesToEmpty();
            }
            for await (const response of promises) {
                assert.equal(response.statusCode, 200);
            }
        }
        let i = batchSize;
        while (i <= testSize) {
            await doBatch(batchSize);
            i += batchSize;
        }
        await doBatch(testSize % batchSize);
    });

    test("Only one StripePaymentAccept object should be created", async () => {
        // Wait for SQS to process the messages. Increase the timeout if this fails.
        let newCount = 0;
        for (let i = 0; i < 5 * testScale; i++) {
            console.log(`Waiting for SQS to process the messages. (${i * 10}s)`);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            newCount = await context.batched.StripePaymentAccept.count({ user: UserPK.stringify(testUser) });
            if (newCount > 0) {
                break;
            }
        }
        expect(newCount).toBe(1);
    });
});

describe(`Test AcceptPayment is queued properly by invoking the handler ${testSize} times at the same time. All ${testSize} requests should be accepted.`, () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    beforeAll(async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });

        console.log(`Send checkout.session.completed event ${testSize} times with different session ids`);

        const batchSize = 10;
        async function doBatch(size: number) {
            const promises = [];
            for (let i = 0; i < size; i++) {
                const p = AcceptPayment(
                    makeAcceptStripePaymentLambdaEvent({
                        userPK: UserPK.stringify(testUser),
                        userEmail: testUserEmail,
                    }),
                    {
                        parseStripeEvent: (result) => {
                            const stripeEvent: stripe.Event = JSON.parse(result.body!);
                            stripeEvent.type = "checkout.session.completed";
                            const sessionObject: StripeSessionObject = {
                                ...(stripeEvent.data.object as StripeSessionObject),
                                id: uuidv4(),
                                payment_status: "paid",
                            };
                            stripeEvent.data.object = sessionObject;
                            return stripeEvent;
                        },
                    }
                );
                promises.push(p);
            }
            if (process.env.LOCAL_SQS === "1") {
                await mockSQS.waitForQueuesToEmpty();
            }
            for await (const response of promises) {
                assert.equal(response.statusCode, 200);
            }
        }
        let i = batchSize;
        while (i <= testSize) {
            await doBatch(batchSize);
            i += batchSize;
        }
        await doBatch(testSize % batchSize);
    });

    test(
        `${testSize} StripePaymentAccept objects should be created`,
        async () => {
            // Wait for SQS to process the messages. Increase the timeout if this fails.
            let newCount = 0;
            for (let i = 0; i < 10 * testScale; i++) {
                console.log(`Waiting for SQS to process the messages. (${i * 10}s)`);
                await new Promise((resolve) => setTimeout(resolve, 10_000));
                newCount = await context.batched.StripePaymentAccept.count({ user: UserPK.stringify(testUser) });
                if (newCount >= testSize) {
                    break;
                }
            }
            expect(newCount).toBe(testSize);
        },
        20_000 * testScale
    );
});
