import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import { handle as AcceptPayment, StripeSessionObject, context } from "../handlers/AcceptStripePayment";
import { AuthorizerContext, LambdaEventV2 } from "../utils/LambdaContext";
import { GQLUserIndex } from "__generated__/gql-operations";
import { UserPK } from "graphql-service/pks/UserPK";
import { User } from "graphql-service/dynamoose/models";
import stripe from "stripe";
import { v4 as uuidv4 } from "uuid";

const authorizerContext: AuthorizerContext = {
    userEmail: "testuser1.fastchargeapi@gmail.com",
};

const baseLambdaEvent: LambdaEventV2 = {
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
            lambda: authorizerContext,
        },
        http: {
            method: "POST",
            path: "/accept-payment",
            protocol: "HTTP/1.1",
            sourceIp: "72.136.80.113",
            userAgent: "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
        },
        requestId: "BwszojTbIAMEVHQ=",
        routeKey: "POST /accept-payment",
        stage: "$default",
        time: "14/Mar/2023:07:53:58 +0000",
        timeEpoch: 1678780438960,
    },
    body: '{\n  "id": "evt_1MlSgEB24cItJ1WSxns0XHtY",\n  "object": "event",\n  "api_version": "2022-11-15",\n  "created": 1678780438,\n  "data": {\n    "object": {\n      "id": "cs_test_a1IFhAjV63n9o9gDkGOOSc0Bc4WhTwLIxKfj3nbDpVnxheqYwqbzQAaoRR",\n      "object": "checkout.session",\n      "after_expiration": null,\n      "allow_promotion_codes": null,\n      "amount_subtotal": 100,\n      "amount_total": 100,\n      "automatic_tax": {\n        "enabled": true,\n        "status": "complete"\n      },\n      "billing_address_collection": null,\n      "cancel_url": "https://fastchargeapi.com/topup?amount_cents=100\\u0026jwe=5740814a6b284b206a47946708f7f3aff0afc0a71d3b9a374b0c2d4d31453176d9d9dd4ed189b04fb10e8aeb77624216f5225fb5626e10e8b8bdff55da478b35\\u0026jwt=a887df3b07cbff70aaf6fb92f8cb6edd7fcaea4da5f6ba565cf019450c6475b6f8c7fe39c4d6fec08ae5032dbd86efb694a348e9b4c35922d86d55dea85ce00f\\u0026key=3ac54ef211c847d7bf3ba2765c460365\\u0026cancel=true",\n      "client_reference_id": null,\n      "consent": null,\n      "consent_collection": null,\n      "created": 1678780433,\n      "currency": "usd",\n      "custom_fields": [\n\n      ],\n      "custom_text": {\n        "shipping_address": null,\n        "submit": null\n      },\n      "customer": "cus_NWVhYd0EBxFAjs",\n      "customer_creation": "always",\n      "customer_details": {\n        "address": {\n          "city": null,\n          "country": "CA",\n          "line1": null,\n          "line2": null,\n          "postal_code": "N2K 4L1",\n          "state": null\n        },\n        "email": "testuser1.fastchargeapi@gmail.com",\n        "name": "4242424242",\n        "phone": null,\n        "tax_exempt": "none",\n        "tax_ids": [\n\n        ]\n      },\n      "customer_email": "testuser1.fastchargeapi@gmail.com",\n      "expires_at": 1678866832,\n      "invoice": null,\n      "invoice_creation": {\n        "enabled": false,\n        "invoice_data": {\n          "account_tax_ids": null,\n          "custom_fields": null,\n          "description": null,\n          "footer": null,\n          "metadata": {\n          },\n          "rendering_options": null\n        }\n      },\n      "livemode": false,\n      "locale": null,\n      "metadata": {\n      },\n      "mode": "payment",\n      "payment_intent": "pi_3MlSgCB24cItJ1WS1HzdJmO5",\n      "payment_link": null,\n      "payment_method_collection": "always",\n      "payment_method_options": {\n      },\n      "payment_method_types": [\n        "card"\n      ],\n      "payment_status": "paid",\n      "phone_number_collection": {\n        "enabled": false\n      },\n      "recovered_from": null,\n      "setup_intent": null,\n      "shipping_address_collection": null,\n      "shipping_cost": null,\n      "shipping_details": null,\n      "shipping_options": [\n\n      ],\n      "status": "complete",\n      "submit_type": null,\n      "subscription": null,\n      "success_url": "https://fastchargeapi.com/topup?amount_cents=100\\u0026jwe=5740814a6b284b206a47946708f7f3aff0afc0a71d3b9a374b0c2d4d31453176d9d9dd4ed189b04fb10e8aeb77624216f5225fb5626e10e8b8bdff55da478b35\\u0026jwt=a887df3b07cbff70aaf6fb92f8cb6edd7fcaea4da5f6ba565cf019450c6475b6f8c7fe39c4d6fec08ae5032dbd86efb694a348e9b4c35922d86d55dea85ce00f\\u0026key=3ac54ef211c847d7bf3ba2765c460365\\u0026success=true",\n      "total_details": {\n        "amount_discount": 0,\n        "amount_shipping": 0,\n        "amount_tax": 0\n      },\n      "url": null\n    }\n  },\n  "livemode": false,\n  "pending_webhooks": 2,\n  "request": {\n    "id": null,\n    "idempotency_key": null\n  },\n  "type": "checkout.session.completed"\n}',
    isBase64Encoded: false,
};

jest.setTimeout(60_000);
let testUser: User;
beforeAll(async () => {
    testUser = await context.batched.User.get(
        { email: baseLambdaEvent.requestContext.authorizer.lambda.userEmail },
        { using: GQLUserIndex.IndexByEmailOnlyPk }
    );
});

describe("Test create order and fulfill immediately", () => {
    test("Clearing the StripePaymentAccept table", async () => {
        await clearStripePaymentAcceptTable();
    });
    test(
        "A checkout.session.completed event where payment_status === 'paid'" +
            " should create an StripePaymentAccept object in the SQS, and settle it immediately",
        async () => {
            await AcceptPayment(baseLambdaEvent, {
                parseStripeEvent: (result) => {
                    let stripeEvent: stripe.Event = JSON.parse(result.body!);
                    stripeEvent.type = "checkout.session.completed";
                    let sessionObject: StripeSessionObject = {
                        ...(stripeEvent.data.object as StripeSessionObject),
                        payment_status: "paid",
                        id: uuidv4(),
                    };
                    stripeEvent.data.object = sessionObject;
                    return stripeEvent;
                },
            });
            // Wait for SQS to process the messages. Increase the timeout if this fails.
            let newCount = 0;
            for (let i = 0; i < 5; i++) {
                console.log("Waiting for SQS to process the messages.", i);
                await new Promise((resolve) => setTimeout(resolve, 10_000));
                newCount = await context.batched.StripePaymentAccept.count(
                    { user: UserPK.stringify(testUser) },
                    { consistent: true }
                );
                if (newCount > 0) {
                    break;
                }
            }
            expect(newCount).toBeGreaterThan(0);
        }
    );
    test("The StripePaymentAccept object should be settled", async () => {
        let newPaymentAccept = await context.batched.StripePaymentAccept.get(
            {
                user: UserPK.stringify(testUser),
            },
            { consistent: true }
        );
        expect(newPaymentAccept).not.toBeNull();
        expect(newPaymentAccept.status).toBe("settled");
    });
});

describe("Test AcceptPayment is idempotent", () => {
    test("Clearing the StripePaymentAccept table", async () => {
        await clearStripePaymentAcceptTable();
    });
    test("Call lambdaHandler asynchronosuly 20 times with the same stripe session ID", async () => {
        const sessionId = uuidv4();
        let promises = [];
        for (let i = 0; i < 20; i++) {
            let p = AcceptPayment(baseLambdaEvent, {
                parseStripeEvent: (result) => {
                    let stripeEvent: stripe.Event = JSON.parse(result.body!);
                    stripeEvent.type = "checkout.session.completed";
                    let sessionObject: StripeSessionObject = {
                        ...(stripeEvent.data.object as StripeSessionObject),
                        id: sessionId,
                        payment_status: "paid",
                    };
                    stripeEvent.data.object = sessionObject;
                    return stripeEvent;
                },
            });
            promises.push(p);
        }
        await Promise.all(promises);
    });
    test("Only one StripePaymentAccept object should be created", async () => {
        // Wait for SQS to process the messages. Increase the timeout if this fails.
        let newCount = 0;
        for (let i = 0; i < 5; i++) {
            console.log("Waiting for SQS to process the messages.", i);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            newCount = await context.batched.StripePaymentAccept.count(
                { user: UserPK.stringify(testUser) },
                { consistent: true }
            );
            if (newCount > 0) {
                break;
            }
        }
        expect(newCount).toBe(1);
    });
});

describe("Test AcceptPayment is queued properly", () => {
    test("Clearing the StripePaymentAccept table", async () => {
        await clearStripePaymentAcceptTable();
    });

    test("Send checkout.session.completed event 20 times with different session ids", async () => {
        let promises = [];
        for (let i = 0; i < 20; i++) {
            let p = AcceptPayment(baseLambdaEvent, {
                parseStripeEvent: (result) => {
                    let stripeEvent: stripe.Event = JSON.parse(result.body!);
                    stripeEvent.type = "checkout.session.completed";
                    let sessionObject: StripeSessionObject = {
                        ...(stripeEvent.data.object as StripeSessionObject),
                        id: uuidv4(),
                        payment_status: "paid",
                    };
                    stripeEvent.data.object = sessionObject;
                    return stripeEvent;
                },
            });
            promises.push(p);
        }
        await Promise.all(promises);
    });

    test("20 StripePaymentAccept objects should be created", async () => {
        // Wait for SQS to process the messages. Increase the timeout if this fails.
        let newCount = 0;
        for (let i = 0; i < 5; i++) {
            console.log("Waiting for SQS to process the messages.", i);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            newCount = await context.batched.StripePaymentAccept.count(
                { user: UserPK.stringify(testUser) },
                { consistent: true }
            );
            if (newCount > 0) {
                break;
            }
        }
        expect(newCount).toBe(20);
    });
});

async function clearStripePaymentAcceptTable() {
    let deleted = await context.batched.StripePaymentAccept.deleteMany({
        user: UserPK.stringify(testUser),
    });
    console.log("Deleted", deleted.length, "StripePaymentAccepts");
    let count = await context.batched.StripePaymentAccept.count(
        { user: UserPK.stringify(testUser) },
        { consistent: true }
    );
    expect(count).toBe(0);
}
