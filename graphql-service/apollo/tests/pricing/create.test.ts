import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { RequestContext, createDefaultContextBatched } from "../../RequestContext";
import { GQLPricingAvailability } from "../../__generated__/resolvers-types";
import { App, Pricing, User } from "../../dynamoose/models";
import { Denied } from "../../errors";
import { AppPK } from "../../pks/AppPK";
import { PricingPK } from "../../pks/PricingPK";
import { UserPK } from "../../pks/UserPK";
import { pricingResolvers } from "../../resolvers/pricing";
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
let testOtherUser: User;
let testApp: App;
let testPricing: Pricing;
let contextAsAppOwner: RequestContext;
let contextAsOtherUser: RequestContext; // An arbitrary user that is not the owner of the app.

beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAppOwnerEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testOtherUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    testAppOwner = await getOrCreateTestUser(context, { email: testAppOwnerEmail });
    testOtherUser = await getOrCreateTestUser(context, { email: testOtherUserEmail });
    testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testAppOwner) });
    testPricing = await context.batched.Pricing.create({
        name: "Premium",
        app: AppPK.stringify(testApp),
        availability: GQLPricingAvailability.Public,
    });
    contextAsAppOwner = {
        ...context,
        currentUser: testAppOwner,
    };
    contextAsOtherUser = {
        ...context,
        currentUser: testOtherUser,
    };
});

describe("Test create pricing", () => {
    test("App owner can create pricing", async () => {
        const result = await pricingResolvers.Mutation?.createPricing?.(
            {},
            {
                name: "Premium",
                app: AppPK.stringify(testApp),
                availability: GQLPricingAvailability.Public,
                minMonthlyCharge: "0",
                chargePerRequest: "0",
                freeQuota: 100,
            },
            contextAsAppOwner,
            {} as never
        );
        expect(result).not.toBe(null);
        expect(PricingPK.stringify(result!)).not.toBe(null);
    });

    test("Other user can't create pricing for app they don't own.", async () => {
        await expect(async () => {
            await pricingResolvers.Mutation?.createPricing?.(
                {},
                {
                    name: "Premium",
                    app: AppPK.stringify(testApp),
                    availability: GQLPricingAvailability.Public,
                    minMonthlyCharge: "0",
                    chargePerRequest: "0",
                    freeQuota: 100,
                },
                contextAsOtherUser,
                {} as never
            );
        }).rejects.toThrowError(Denied);
    });
});
