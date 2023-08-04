import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { RequestContext, createDefaultContextBatched } from "../../RequestContext";
import { graphql } from "../../__generated__/gql";
import { GQLPricingAvailability } from "../../__generated__/resolvers-types";
import { App, Pricing, User } from "../../dynamoose/models";
import { AppPK } from "../../pks/AppPK";
import { PricingPK } from "../../pks/PricingPK";
import { UserPK } from "../../pks/UserPK";
import { testGQLClient } from "../test-sql-client";
import { getOrCreateTestUser } from "../test-utils";

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
        availability: GQLPricingAvailability.Public,
        minMonthlyCharge: "0",
        chargePerRequest: "0",
        freeQuota: 0,
        callToAction: "test-call-to-action",
    });
});

const deletePricingMutation = graphql(`
    query DeletePricingByPK($pk: ID!) {
        pricing(pk: $pk) {
            deletePricing {
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
    }
`);

describe("deletePricing", () => {
    test("App owner can delete pricing", async () => {
        const result = await testGQLClient({ user: testAppOwner }).mutate({
            mutation: deletePricingMutation,
            variables: {
                pk: PricingPK.stringify(testPricing),
            },
        });
        expect(result.data?.pricing?.deletePricing).toEqual({
            __typename: "Pricing",
            pk: PricingPK.stringify(testPricing),
            name: "test-pricing",
            app: { __typename: "App", pk: AppPK.stringify(testApp) },
            availability: GQLPricingAvailability.Public,
            minMonthlyCharge: "0",
            chargePerRequest: "0",
            freeQuota: 0,
            callToAction: "test-call-to-action",
            createdAt: testPricing.createdAt,
            updatedAt: testPricing.updatedAt,
        });
    });

    test("Other owners cannot delete pricing they don't own.", async () => {
        await expect(async () => {
            const result = await testGQLClient({ user: testOtherUser }).mutate({
                context,
                mutation: deletePricingMutation,
                variables: {
                    pk: PricingPK.stringify(testPricing),
                },
            });
        }).rejects.toMatchGraphQLError({
            code: "PERMISSION_DENIED",
        });
    });
});
