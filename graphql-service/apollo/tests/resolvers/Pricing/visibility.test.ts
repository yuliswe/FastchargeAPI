import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { graphql } from "@/__generated__/gql";
import { PricingAvailability } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { Pricing } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { testGQLClient } from "@/tests/testGQLClient";
import { untypedGraphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

// jest.retryTimes(2);
let testAppOwner: User;
let testAppUser: User;
let testApp: App;
let testPricing: Pricing;

const getPricingByPKQuery = graphql(`
    query VisibilityTestQueryPricing($pk: ID!) {
        pricing(pk: $pk) {
            pk
            name
            availability
            minMonthlyCharge
            chargePerRequest
            freeQuota
            callToAction
            freeQuota
            updatedAt
            createdAt
            app {
                pk
            }
        }
    }
`);

function getPricingByPKQueryExpectedValue(pricing: Pricing) {
    return {
        __typename: "Pricing",
        pk: PricingPK.stringify(pricing),
        name: pricing.name,
        app: { __typename: "App", pk: pricing.app },
        availability: pricing.availability,
        minMonthlyCharge: pricing.minMonthlyCharge,
        chargePerRequest: pricing.chargePerRequest,
        freeQuota: pricing.freeQuota,
        callToAction: pricing.callToAction,
        createdAt: Number(pricing.createdAt),
        updatedAt: Number(pricing.updatedAt),
    };
}

const listAppPricingsQuery = graphql(`
    query VisibilityTest_ListAppPlans($app: ID!) {
        getApp(pk: $app) {
            pricingPlans {
                pk
            }
        }
    }
`);

beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAppOwnerEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    testAppOwner = await getOrCreateTestUser(context, { email: testAppOwnerEmail });
    testAppUser = await getOrCreateTestUser(context, { email: testAppUserEmail });
    testApp = await context.batched.App.createOverwrite({ name: testAppName, owner: UserPK.stringify(testAppOwner) });
    testPricing = await context.batched.Pricing.create({
        name: "test-pricing",
        app: AppPK.stringify(testApp),
        availability: PricingAvailability.Public,
        minMonthlyCharge: "0",
        chargePerRequest: "0",
        freeQuota: 0,
        callToAction: "test-call-to-action",
    });
});

describe("Test pricing visibility", () => {
    test("App owner can see pricing", async () => {
        const result = await testGQLClient({ user: testAppOwner }).query({
            query: getPricingByPKQuery,
            variables: { pk: PricingPK.stringify(testPricing) },
        });
        expect(result?.data.pricing).toEqual({
            __typename: "Pricing",
            pk: PricingPK.stringify(testPricing),
            name: "test-pricing",
            app: { __typename: "App", pk: AppPK.stringify(testApp) },
            availability: PricingAvailability.Public,
            minMonthlyCharge: "0",
            chargePerRequest: "0",
            freeQuota: 0,
            callToAction: "test-call-to-action",
            createdAt: testPricing.createdAt,
            updatedAt: testPricing.updatedAt,
        });
    });

    test("App user can see public pricing", async () => {
        const result = await testGQLClient({ user: testAppUser }).query({
            query: getPricingByPKQuery,
            variables: { pk: PricingPK.stringify(testPricing) },
        });
        expect(result?.data.pricing).toEqual(getPricingByPKQueryExpectedValue(testPricing));
    });

    test("App user cannot see pricing if the user is not subscribed to it (ger pricing by PK)", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: PricingAvailability.ExistingSubscribers,
        });
        for (const key of [
            "pk",
            "name",
            "availability",
            "minMonthlyCharge",
            "chargePerRequest",
            "freeQuota",
            "callToAction",
            "createdAt",
            "updatedAt",
        ]) {
            const promise = testGQLClient({ user: testAppUser }).query({
                query: untypedGraphql(`
                    query VisibilityTestQueryPricing($pk: ID!) {
                        pricing(pk: $pk) {
                            ${key}
                        }
                    }
                `),
                variables: { pk: PricingPK.stringify(testPricing) },
            });
            await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
                {
                    code: "PERMISSION_DENIED",
                    path: "pricing." + key,
                },
            ]);
        }
    });

    test("App user cannot see pricing if the user is not subscribed to it (list app pricing)", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: PricingAvailability.ExistingSubscribers,
        });
        const result = await testGQLClient({ user: testAppUser }).query({
            query: listAppPricingsQuery,
            variables: {
                app: AppPK.stringify(testApp),
            },
        });
        expect(result?.data.getApp.pricingPlans.length).toBe(0);
    });

    test("App user can see pricing if subscribed (get pricing by PK)", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: PricingAvailability.ExistingSubscribers,
        });
        await context.batched.Subscription.create({
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
            subscriber: UserPK.stringify(testAppUser),
        });
        const result = await testGQLClient({ user: testAppUser }).query({
            query: getPricingByPKQuery,
            variables: { pk: PricingPK.stringify(testPricing) },
        });
        expect(result?.data.pricing).toEqual(getPricingByPKQueryExpectedValue(testPricing));
    });

    test("App user can see pricing if subscribed (list app pricing)", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: PricingAvailability.ExistingSubscribers,
        });
        await context.batched.Subscription.create({
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
            subscriber: UserPK.stringify(testAppUser),
        });

        const result = await testGQLClient({ user: testAppUser }).query({
            query: listAppPricingsQuery,
            variables: {
                app: AppPK.stringify(testApp),
            },
        });
        expect(result?.data.getApp.pricingPlans.length).toBe(1);
        expect(result?.data.getApp.pricingPlans[0].pk).toEqual(PricingPK.stringify(testPricing));
    });
});
