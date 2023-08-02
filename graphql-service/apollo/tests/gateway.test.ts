import { describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { GQLGatewayDecisionResponseReason } from "../__generated__/resolvers-types";
import { App, Subscription, User } from "../dynamoose/models";
import { AppPK } from "../pks/AppPK";
import { PricingPK } from "../pks/PricingPK";
import { UserPK } from "../pks/UserPK";
import { gatewayResolvers } from "../resolvers/gateway";
import { addMoneyForUser, getOrCreateTestUser } from "./test-utils";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Gateway API success access", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppName = `testapp-${uuidv4()}`;
    let testUser: User;
    let testApp: App;

    test("Prepare: Create test user and test app", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
        testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testUser) });
    });

    let pricingPK: string;
    test("Preparation: create a Pricing or use existing", async () => {
        const pricingRequirement = {
            app: AppPK.stringify(testApp),
            name: "Premium",
            minMonthlyCharge: "1",
            chargePerRequest: "0.001",
        };
        let pricing = await context.batched.Pricing.getOrNull(pricingRequirement);
        if (pricing === null) {
            pricing = await context.batched.Pricing.create(pricingRequirement);
        }
        pricingPK = PricingPK.stringify(pricing);
    });

    let subscription: Subscription;
    test("Preparation: subscribe user to this Pricing", async () => {
        const sub = await context.batched.Subscription.getOrNull({
            subscriber: UserPK.stringify(testUser),
        });
        if (sub === null) {
            subscription = await context.batched.Subscription.create({
                app: AppPK.stringify(testApp),
                subscriber: UserPK.stringify(testUser),
                pricing: pricingPK,
            });
        } else {
            subscription = await context.batched.Subscription.update(sub, { pricing: pricingPK });
        }
    });

    test("Prepration: Add monty to the account", async () => {
        await addMoneyForUser(context, { user: UserPK.stringify(testUser), amount: "10" });
    });

    test("Call checkUserIsAllowedForGatewayRequest", async () => {
        const result = await gatewayResolvers.Query.checkUserIsAllowedForGatewayRequest!(
            {},
            {
                user: UserPK.stringify(testUser),
                app: AppPK.stringify(testApp),
                forceBalanceCheck: true,
                forceAwait: true,
            },
            context,
            {} as never
        );
        expect(result.allowed).toBe(true);
        expect(result.userPK).toBe(UserPK.stringify(testUser));
    });
});

describe("Test making an API request when not subscribed", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppName = `testapp-${uuidv4()}`;
    let testUser: User;
    let testApp: App;

    test("Prepare: Create test user and test app", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
        testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testUser) });
    });

    let pricingPK: string;
    test("Preparation: create a Pricing or use existing", async () => {
        const pricingRequirement = {
            app: AppPK.stringify(testApp),
            name: "Premium",
            minMonthlyCharge: "1",
            chargePerRequest: "0.001",
        };
        let pricing = await context.batched.Pricing.getOrNull(pricingRequirement);
        if (pricing === null) {
            pricing = await context.batched.Pricing.create(pricingRequirement);
        }
        pricingPK = PricingPK.stringify(pricing);
    });

    test("Call checkUserIsAllowedForGatewayRequest", async () => {
        const result = await gatewayResolvers.Query.checkUserIsAllowedForGatewayRequest!(
            {},
            {
                user: UserPK.stringify(testUser),
                app: AppPK.stringify(testApp),
                forceBalanceCheck: true,
                forceAwait: true,
            },
            context,
            {} as never
        );
        expect(result.allowed).toStrictEqual(false);
        expect(result.reason).toStrictEqual(GQLGatewayDecisionResponseReason.NotSubscribed);
    });
});

describe("Calling checkUserIsAllowedForGatewayRequest with an invalid app name shouldn't crash", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppName = `testapp-${uuidv4()}`;
    let testUser: User;
    let testApp: App;

    test("Prepare: Create test user and test app", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
        testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testUser) });
    });

    test("Call checkUserIsAllowedForGatewayRequest with invalid app", async () => {
        const result = await gatewayResolvers.Query.checkUserIsAllowedForGatewayRequest!(
            {},
            {
                user: UserPK.stringify(testUser),
                app: "???????",
                forceBalanceCheck: false,
                forceAwait: false,
            },
            context,
            {} as never
        );
        expect(result.allowed).toStrictEqual(false);
    });
});
