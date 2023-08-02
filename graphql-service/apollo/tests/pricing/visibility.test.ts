import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { RequestContext, createDefaultContextBatched } from "../../RequestContext";
import { GQLPricingAvailability } from "../../__generated__/resolvers-types";
import { App, Pricing, User } from "../../dynamoose/models";
import { Denied } from "../../errors";
import { AppPK } from "../../pks/AppPK";
import { PricingPK } from "../../pks/PricingPK";
import { UserPK } from "../../pks/UserPK";
import { appResolvers } from "../../resolvers/app";
import { pricingResolvers } from "../../resolvers/pricing";
import { getOrCreateTestUser } from "../test-utils";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
};

// jest.retryTimes(2);
let testAppOwner: User;
let testAppUser: User;
let testApp: App;
let testPricing: Pricing;
let contextAsAppOwner: RequestContext;
let contextAsAppUser: RequestContext; // An arbitrary user that is not the owner of the app.

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
    contextAsAppOwner = {
        ...context,
        currentUser: testAppOwner,
    };
    contextAsAppUser = {
        ...context,
        currentUser: testAppUser,
    };
});

describe("Test pricing visibility", () => {
    test("App owner can see pricing", async () => {
        const result = await pricingResolvers.Query?.pricing?.(
            {},
            { pk: PricingPK.stringify(testPricing) },
            contextAsAppOwner,
            {} as never
        );
        expect(result).not.toBe(null);
        expect(PricingPK.stringify(result!)).toEqual(PricingPK.stringify(testPricing));
    });

    test("App user can see public pricing", async () => {
        const result = await pricingResolvers.Query?.pricing?.(
            {},
            { pk: PricingPK.stringify(testPricing) },
            contextAsAppUser,
            {} as never
        );
        expect(result).not.toBe(null);
        expect(PricingPK.stringify(result!)).toEqual(PricingPK.stringify(testPricing));
    });

    test("App user cannot see pricing if the user is not subscribed to it (ger pricing by PK)", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: GQLPricingAvailability.ExistingSubscribers,
        });
        await expect(async () => {
            const result = await pricingResolvers.Query?.pricing?.(
                {},
                { pk: PricingPK.stringify(testPricing) },
                contextAsAppUser,
                {} as never
            );
        }).rejects.toThrow(Denied);
    });

    test("App user cannot see pricing if the user is not subscribed to it (list app pricing)", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: GQLPricingAvailability.ExistingSubscribers,
        });
        const result = await appResolvers.App?.pricingPlans?.(testApp, {}, contextAsAppUser, {} as never);
        expect(result).not.toBe(null);
        expect(result instanceof Array).toBe(true);
        expect(result?.length).toBe(0);
    });

    test("App user can see pricing if subscribed (ger pricing by PK)", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: GQLPricingAvailability.ExistingSubscribers,
        });
        await context.batched.Subscription.create({
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
            subscriber: UserPK.stringify(testAppUser),
        });
        const result = await pricingResolvers.Query?.pricing?.(
            {},
            { pk: PricingPK.stringify(testPricing) },
            contextAsAppUser,
            {} as never
        );
        expect(result).not.toBe(null);
        expect(PricingPK.stringify(result!)).toEqual(PricingPK.stringify(testPricing));
    });

    test("App user can see pricing if subscribed (list app pricing)", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: GQLPricingAvailability.ExistingSubscribers,
        });
        await context.batched.Subscription.create({
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
            subscriber: UserPK.stringify(testAppUser),
        });
        const result = await appResolvers.App?.pricingPlans?.(testApp, {}, contextAsAppUser, {} as never);
        expect(result).not.toBe(null);
        expect(result instanceof Array).toBe(true);
        expect(result?.length).toBe(1);
        expect(PricingPK.stringify(await result![0])).toEqual(PricingPK.stringify(testPricing));
    });
});
