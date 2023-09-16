import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { graphql } from "@/__generated__/gql";
import { PricingAvailability } from "@/__generated__/gql/graphql";
import { App, Pricing, UsageSummary, User } from "@/database/models";
import { Can } from "@/permissions";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { getOrCreateTestUser, simplifyGraphQLPromiseRejection, sortGraphQLErrors } from "@/tests/test-utils";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

let testAppOwner: User;
let testSubscriber: User;
let testOtherUser: User;
let testApp: App;
let testPricing: Pricing;
const testUsageSummaries: UsageSummary[] = [];

const listUsageSummaries = graphql(`
    query TestListUsageSummary($subscriber: ID!, $app: ID!) {
        listUsageSummaries(subscriber: $subscriber, app: $app) {
            pk
            createdAt
            status
            billedAt
            billed
            volume
            app {
                pk
            }
            subscriber {
                pk
            }
            billingRequestChargeAccountActivity {
                pk
            }
        }
    }
`);

const privateUsageSummaryFields = [
    "pk",
    "createdAt",
    "status",
    "billedAt",
    "billed",
    "volume",
    "app",
    "subscriber",
    "billingRequestChargeAccountActivity",
].sort((a, b) => a.localeCompare(b));

beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAppOwnerEmail = `testuser_appowner_${uuidv4()}@gmail_mock.com`;
    const testSubscriberEmail = `testuser_subscriber_${uuidv4()}@gmail_mock.com`;
    testOtherUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
    testAppOwner = await getOrCreateTestUser(context, { email: testAppOwnerEmail });
    testSubscriber = await getOrCreateTestUser(context, { email: testSubscriberEmail });
    testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testAppOwner) });
    testPricing = await context.batched.Pricing.create({
        name: "test-pricing",
        app: AppPK.stringify(testApp),
        availability: PricingAvailability.Public,
        minMonthlyCharge: "0",
        chargePerRequest: "0",
        freeQuota: 0,
        callToAction: "test-call-to-action",
    });
    for (let i = 0; i < 1; i++) {
        const usageSummary = await context.batched.UsageSummary.create({
            app: AppPK.stringify(testApp),
            subscriber: UserPK.stringify(testSubscriber),
            volume: 1,
            numberOfLogs: 1,
            pricing: PricingPK.stringify(testPricing),
            path: "/",
        });
        testUsageSummaries.push(usageSummary);
    }
});

describe("listUsageSummaries", () => {
    test("UsageSummary owner (subscriber) can list UsageSummaries", async () => {
        const result = await testGQLClient({ user: testSubscriber }).query({
            query: listUsageSummaries,
            variables: {
                subscriber: UserPK.stringify(testSubscriber),
                app: AppPK.stringify(testApp),
            },
        });
        expect(result.data.listUsageSummaries).toMatchObject(
            testUsageSummaries.map((x) => ({
                subscriber: {
                    pk: UserPK.stringify(testSubscriber),
                },
                app: {
                    pk: AppPK.stringify(testApp),
                },
                createdAt: expect.any(Number),
                billed: false,
                status: "pending",
                volume: 1,
            }))
        );
    });

    test("A user cannot list UsageSummaries that they don't own", async () => {
        const result = testGQLClient({ user: testAppOwner }).query({
            query: listUsageSummaries,
            variables: {
                subscriber: UserPK.stringify(testSubscriber),
                app: AppPK.stringify(testApp),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "listUsageSummaries",
            },
        ]);
    });

    test("A user cannot see the private fields of UsageSummaries on an object that they don't own", async () => {
        // Forces the listUsageSummaries to pass so that we can test the private
        // fields.
        jest.spyOn(Can, "listUsageSummaries").mockImplementation(() => Promise.resolve(true));
        const result = testGQLClient({ user: testOtherUser }).query({
            query: listUsageSummaries,
            variables: {
                subscriber: UserPK.stringify(testSubscriber),
                app: AppPK.stringify(testApp),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject(
            sortGraphQLErrors(
                privateUsageSummaryFields.map((f) => ({
                    code: "PERMISSION_DENIED",
                    message: "You do not have permission to perform this action.",
                    path: `listUsageSummaries.0.${f}`,
                }))
            )
        );
    });

    test("App ower cannot see any field of a subscriber's UsageSummary other than volume", async () => {
        // Forces the listUsageSummaries to pass so that we can test the private
        // fields.
        jest.spyOn(Can, "listUsageSummaries").mockImplementation(() => Promise.resolve(true));
        const result = testGQLClient({ user: testAppOwner }).query({
            query: listUsageSummaries,
            variables: {
                subscriber: UserPK.stringify(testSubscriber),
                app: AppPK.stringify(testApp),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject(
            sortGraphQLErrors(
                privateUsageSummaryFields
                    .filter((f) => f != "volume")
                    .map((f) => ({
                        code: "PERMISSION_DENIED",
                        message: "You do not have permission to perform this action.",
                        path: `listUsageSummaries.0.${f}`,
                    }))
            )
        );
    });

    test("App owner can see the volume field of a subscriber's UsageSummary", async () => {
        // Forces the listUsageSummaries to pass so that we can test the private
        // fields.
        jest.spyOn(Can, "listUsageSummaries").mockImplementation(() => Promise.resolve(true));
        const result = testGQLClient({ user: testAppOwner }).query({
            query: graphql(`
                query TestAppOwnerCanReadVolume($subscriber: ID!, $app: ID!) {
                    listUsageSummaries(subscriber: $subscriber, app: $app) {
                        volume
                    }
                }
            `),
            variables: {
                subscriber: UserPK.stringify(testSubscriber),
                app: AppPK.stringify(testApp),
            },
        });
        await expect(result).resolves.toMatchObject({ data: { listUsageSummaries: [{ volume: 1 }] } });
    });
});
