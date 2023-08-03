import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { RequestContext, createDefaultContextBatched } from "../../RequestContext";
import { GQLPricingAvailability } from "../../__generated__/resolvers-types";
import { App, Pricing, User } from "../../dynamoose/models";
import { Denied } from "../../errors";
import { AppPK } from "../../pks/AppPK";
import { PricingPK } from "../../pks/PricingPK";
import { UserPK } from "../../pks/UserPK";
import { subscriptionResolvers } from "../../resolvers/subscription";
import { getOrCreateTestUser } from "../test-utils";

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
let contextAsOwner: RequestContext;
let contextAsUser: RequestContext; // An arbitrary user that is not the owner of the app.

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
    contextAsOwner = {
        ...context,
        currentUser: testAppOwner,
    };
    contextAsUser = {
        ...context,
        currentUser: testAppUser,
    };
});

describe("Test pricing subscribility", () => {
    test("User can subscribe to public pricing plan", async () => {
        const result = await subscriptionResolvers.Mutation!.createSubscription!(
            {},
            {
                pricing: PricingPK.stringify(testPricing),
                subscriber: UserPK.stringify(testAppUser),
            },
            contextAsUser,
            {} as never
        );
        expect(result).not.toBe(null);
        expect(result.pricing).toEqual(PricingPK.stringify(testPricing));
        expect(result.subscriber).toEqual(UserPK.stringify(testAppUser));
    });

    test("User can't subscribe to private pricing plan", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: GQLPricingAvailability.ExistingSubscribers,
        });
        await expect(async () => {
            const result = await subscriptionResolvers.Mutation!.createSubscription!(
                {},
                {
                    pricing: PricingPK.stringify(testPricing),
                    subscriber: UserPK.stringify(testAppUser),
                },
                contextAsUser,
                {} as never
            );
        }).rejects.toThrowError(Denied);
    });
});
