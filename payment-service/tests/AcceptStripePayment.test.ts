import { describe, expect, jest, test } from "@jest/globals";
import { RequestContext, UserPK, createDefaultContextBatched } from "graphql-service";
import { User } from "graphql-service/dynamoose/models";
import { getOrCreateTestUser } from "graphql-service/tests/test-utils";
import stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { handle as AcceptPayment, StripeSessionObject } from "../handlers/AcceptStripePayment";
import { LambdaEventV2 } from "../utils/LambdaContext";

const testScale = Number.parseInt(process.env.TEST_SCALE || "1");
const testSize = 20 * testScale;

jest.setTimeout(120_000);
jest.retryTimes(3, { logErrorsBeforeRetry: true });

export const context: RequestContext = {
    service: "payment",
    isServiceRequest: true,
    isSQSMessage: true,
    batched: createDefaultContextBatched(),
};

function makeLambdaEvent({ userEmail, userPK }: { userEmail: string; userPK: string }): LambdaEventV2 {
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
        body: JSON.stringify({
            id: "evt_1MlSgEB24cItJ1WSxns0XHtY",
            object: "event",
            api_version: "2022-11-15",
            created: 1678780438,
            data: {
                object: {
                    id: "cs_test_" + uuidv4(),
                    object: "checkout.session",
                    after_expiration: null,
                    allow_promotion_codes: null,
                    amount_subtotal: 100,
                    amount_total: 100,
                    automatic_tax: { enabled: true, status: "complete" },
                    billing_address_collection: null,
                    cancel_url:
                        "https://fastchargeapi.com/topup?amount_cents=100\\u0026jwe=5740814a6b284b206a47946708f7f3aff0afc0a71d3b9a374b0c2d4d31453176d9d9dd4ed189b04fb10e8aeb77624216f5225fb5626e10e8b8bdff55da478b35\\u0026jwt=a887df3b07cbff70aaf6fb92f8cb6edd7fcaea4da5f6ba565cf019450c6475b6f8c7fe39c4d6fec08ae5032dbd86efb694a348e9b4c35922d86d55dea85ce00f\\u0026key=3ac54ef211c847d7bf3ba2765c460365\\u0026cancel=true",
                    client_reference_id: null,
                    consent: null,
                    consent_collection: null,
                    created: 1678780433,
                    currency: "usd",
                    custom_fields: [],
                    custom_text: { shipping_address: null, submit: null },
                    customer: "cus_NWVhYd0EBxFAjs",
                    customer_creation: "always",
                    customer_details: {
                        address: {
                            city: null,
                            country: "CA",
                            line1: null,
                            line2: null,
                            postal_code: "N2K 4L1",
                            state: null,
                        },
                        email: userEmail,
                        name: "4242424242",
                        phone: null,
                        tax_exempt: "none",
                        tax_ids: [],
                    },
                    customer_email: userEmail,
                    expires_at: 1678866832,
                    invoice: null,
                    invoice_creation: {
                        enabled: false,
                        invoice_data: {
                            account_tax_ids: null,
                            custom_fields: null,
                            description: null,
                            footer: null,
                            metadata: {},
                            rendering_options: null,
                        },
                    },
                    livemode: false,
                    locale: null,
                    metadata: {},
                    mode: "payment",
                    payment_intent: "pi_3MlSgCB24cItJ1WS1HzdJmO5",
                    payment_link: null,
                    payment_method_collection: "always",
                    payment_method_options: {},
                    payment_method_types: ["card"],
                    payment_status: "paid",
                    phone_number_collection: { enabled: false },
                    recovered_from: null,
                    setup_intent: null,
                    shipping_address_collection: null,
                    shipping_cost: null,
                    shipping_details: null,
                    shipping_options: [],
                    status: "complete",
                    submit_type: null,
                    subscription: null,
                    success_url:
                        "https://fastchargeapi.com/topup?amount_cents=100\\u0026jwe=5740814a6b284b206a47946708f7f3aff0afc0a71d3b9a374b0c2d4d31453176d9d9dd4ed189b04fb10e8aeb77624216f5225fb5626e10e8b8bdff55da478b35\\u0026jwt=a887df3b07cbff70aaf6fb92f8cb6edd7fcaea4da5f6ba565cf019450c6475b6f8c7fe39c4d6fec08ae5032dbd86efb694a348e9b4c35922d86d55dea85ce00f\\u0026key=3ac54ef211c847d7bf3ba2765c460365\\u0026success=true",
                    total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
                    url: null,
                },
            },
            livemode: false,
            pending_webhooks: 2,
            request: { id: null, idempotency_key: null },
            type: "checkout.session.completed",
        }),
        isBase64Encoded: false,
    };
}

describe("Test create order and fulfill immediately", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    test("Preparation: get test user", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });
    test(
        "A checkout.session.completed event where payment_status === 'paid'" +
            " should create an StripePaymentAccept object in the SQS, and settle it immediately",
        async () => {
            await AcceptPayment(
                makeLambdaEvent({
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
            expect(newCount).toBeGreaterThan(0);
        }
    );
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

    test("Preparation: get test user", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });
    test(`Call lambdaHandler asynchronosuly ${testSize} times with the same stripe session ID`, async () => {
        const batchSize = 10;
        const sessionId = uuidv4();
        async function doBatch(size: number) {
            const promises = [];
            for (let i = 0; i < size; i++) {
                const p = AcceptPayment(
                    makeLambdaEvent({
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
            for await (const response of promises) {
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

    test("Preparation: get test user", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });

    test(`Send checkout.session.completed event ${testSize} times with different session ids`, async () => {
        const batchSize = 10;
        async function doBatch(size: number) {
            const promises = [];
            for (let i = 0; i < size; i++) {
                const p = AcceptPayment(
                    makeLambdaEvent({
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
            for await (const response of promises) {
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
