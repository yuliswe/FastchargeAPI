import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { graphql } from "@/__generated__/gql";
import { PricingAvailability } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { Pricing } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

let testAppOwner: User;
let testOtherUser: User;
let testApp: App;
let testPricing: Pricing;

beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAppOwnerEmail = `testuser_appowner_${uuidv4()}@gmail_mock.com`;
    const testOtherUserEmail = `testuser_otheruser_${uuidv4()}@gmail_mock.com`;
    testAppOwner = await getOrCreateTestUser(context, { email: testAppOwnerEmail });
    testOtherUser = await getOrCreateTestUser(context, { email: testOtherUserEmail });
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
});

const updatePricingMutation = graphql(`
    query UpdatePricingByPK(
        $pk: ID!
        $name: String
        $availability: PricingAvailability
        $minMonthlyCharge: NonNegativeDecimal
        $chargePerRequest: NonNegativeDecimal
        $callToAction: String
        $freeQuota: Int
    ) {
        pricing(pk: $pk) {
            updatePricing(
                name: $name
                availability: $availability
                minMonthlyCharge: $minMonthlyCharge
                chargePerRequest: $chargePerRequest
                callToAction: $callToAction
                freeQuota: $freeQuota
            ) {
                pk
                name
                availability
                minMonthlyCharge
                chargePerRequest
                freeQuota
                callToAction
                freeQuota
            }
        }
    }
`);

describe("updatePricing", () => {
    test("App owner can update pricing", async () => {
        const variables = {
            pk: PricingPK.stringify(testPricing),
            name: "new pricing",
            availability: PricingAvailability.ExistingSubscribers,
            minMonthlyCharge: "0",
            chargePerRequest: "0",
            callToAction: "new call to action",
            freeQuota: 0,
        };
        const result = await testGQLClient({ user: testAppOwner }).mutate({
            mutation: updatePricingMutation,
            variables,
        });
        expect(result.data?.pricing.updatePricing).toMatchObject(variables);
    });

    test("Other user cannot update pricing they don't own", async () => {
        const variables = {
            pk: PricingPK.stringify(testPricing),
            name: "new pricing",
        };
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: updatePricingMutation,
            variables,
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
            },
        ]);
    });

    test("Cannot update pricing minMonthlyCharge", async () => {
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: updatePricingMutation,
            variables: {
                pk: PricingPK.stringify(testPricing),
                minMonthlyCharge: "1",
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "IMMUTABLE_RESOURCE",
            },
        ]);
    });

    test("Cannot update pricing chargePerRequest", async () => {
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: updatePricingMutation,
            variables: {
                pk: PricingPK.stringify(testPricing),
                chargePerRequest: "1",
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "IMMUTABLE_RESOURCE",
            },
        ]);
    });

    test("Cannot update pricing freeQuota", async () => {
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: updatePricingMutation,
            variables: {
                pk: PricingPK.stringify(testPricing),
                freeQuota: 1,
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "IMMUTABLE_RESOURCE",
            },
        ]);
    });
});
