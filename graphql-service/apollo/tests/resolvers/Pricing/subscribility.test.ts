import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { graphql } from "@/__generated__/gql";
import { GQLPricingAvailability } from "@/__generated__/resolvers-types";
import { App, Pricing, User } from "@/database/models";
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

// jest.retryTimes(2);
let testAppOwner: User;
let testAppUser: User;
let testApp: App;
let testPricing: Pricing;

beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAppOwnerEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    testAppOwner = await getOrCreateTestUser(context, { email: testAppOwnerEmail });
    testAppUser = await getOrCreateTestUser(context, { email: testAppUserEmail });
    testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testAppOwner) });
    testPricing = await context.batched.Pricing.create({
        name: "Premium",
        app: AppPK.stringify(testApp),
        availability: GQLPricingAvailability.Public,
    });
});

const createSubscriptionMutation = graphql(`
    mutation TestPricingSubscribility_CreateSubscription($pricing: ID!, $subscriber: ID!) {
        createSubscription(pricing: $pricing, subscriber: $subscriber) {
            pk
        }
    }
`);

describe("Test pricing subscribility", () => {
    test("User can subscribe to public pricing plan", async () => {
        const result = await testGQLClient({ user: testAppUser }).mutate({
            mutation: createSubscriptionMutation,
            variables: {
                pricing: PricingPK.stringify(testPricing),
                subscriber: UserPK.stringify(testAppUser),
            },
        });
        expect(result.data?.createSubscription).toEqual({
            __typename: "Subscribe",
            pk: expect.any(String),
        });
    });

    test("User can't subscribe to private pricing plan", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: GQLPricingAvailability.ExistingSubscribers,
        });
        const promise = testGQLClient({ user: testAppUser }).mutate({
            mutation: createSubscriptionMutation,
            variables: {
                pricing: PricingPK.stringify(testPricing),
                subscriber: UserPK.stringify(testAppUser),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
            },
        ]);
    });
});
