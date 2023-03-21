import { beforeAll, expect, jest } from "@jest/globals";
import { handle as CreateStripeTransfer, context } from "../handlers/CreateStripeTransfer";
import { LambdaEventV2 } from "utils/LambdaContext";
import { UserPK, getUserBalance } from "graphql-service";
import { GQLUserIndex } from "__generated__/gql-operations";
import { StripeTransfer, User } from "graphql-service/dynamoose/models";
import { Decimal } from "decimal.js-light";
import { AccountActivityPK } from "graphql-service/pks/AccountActivityPK";

let baseLambdaEvent: LambdaEventV2 = {
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
                userEmail: "testuser1.fastchargeapi@gmail.com",
            },
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
    body: "",
    isBase64Encoded: false,
};

jest.setTimeout(120_000);
let testUser: User;
beforeAll(async () => {
    testUser = await context.batched.User.get(
        { email: baseLambdaEvent.requestContext.authorizer.lambda.userEmail },
        { using: GQLUserIndex.IndexByEmailOnlyPk }
    );
});

describe("Test a succesful withdraw to Stripe", () => {
    let userBalance: Decimal;
    test("Before start, the test user should have a minimum of $3", async () => {
        userBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
        expect(userBalance.gte("3")).toBeTruthy();
    });

    test("Clear StripeTransfer table", async () => {
        await clearStripeTransferTable();
    });

    test("Create a StripeTransfer via SQS", async () => {
        let response = await CreateStripeTransfer({
            ...baseLambdaEvent,
            body: JSON.stringify({
                withdraw: "3",
            }),
        });
        expect(response.statusCode).toBe(200);
    });

    test("Check that the StripeTransfer was created", async () => {
        let count = 0;
        for (let i = 0; i < 5; i++) {
            console.log("Waiting for SQS to create the StripeTransfer object", i);
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
            console.log("Waiting for SQS to handle the message", i);
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

describe("Test that the creation of StripeTransfer is properly queued.", () => {
    let userBalance: Decimal;
    test("Before start, the test user should have a minimum of $60", async () => {
        userBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
        expect(userBalance.gte("3")).toBeTruthy();
    });

    test("Clear StripeTransfer table", async () => {
        await clearStripeTransferTable();
    });

    test("Withdraw 20 times asynchronously", async () => {
        let promises = [];
        for (let i = 0; i < 20; i++) {
            let p = CreateStripeTransfer({
                ...baseLambdaEvent,
                body: JSON.stringify({
                    withdraw: "3",
                }),
            });
            promises.push(p);
        }
        await Promise.all(promises);
    });

    test("Check that 20 StripeTransfer objects were created", async () => {
        let count = 0;
        for (let i = 0; i < 5; i++) {
            console.log("Waiting for SQS to create the StripeTransfer object", i);
            await new Promise((resolve) => setTimeout(resolve, 20_000));
            count = await context.batched.StripeTransfer.count({
                receiver: UserPK.stringify(testUser),
            });
            if (count > 0) {
                break;
            }
        }
        expect(count).toEqual(20);
    });

    test("Check the users balance is reduced $30", async () => {
        // Wait for the SQS to handle the message
        let newBalance: Decimal;
        for (let i = 0; i < 5; i++) {
            console.log("Waiting for SQS to handle the message", i);
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            context.batched.AccountHistory.clearCache();
            newBalance = new Decimal(await getUserBalance(context, UserPK.stringify(testUser)));
            if (!newBalance.eq(userBalance)) {
                break;
            }
        }
        expect(newBalance!.toString()).toEqual(userBalance.minus("30").toString());
    });
});

async function clearStripeTransferTable() {
    let deleted = await context.batched.StripeTransfer.deleteMany({
        receiver: UserPK.stringify(testUser),
    });
    console.log("Deleted", deleted.length, "StripeTransfer objects");
    let count = await context.batched.StripeTransfer.count({
        receiver: UserPK.stringify(testUser),
    });
    expect(count).toEqual(0);
}
