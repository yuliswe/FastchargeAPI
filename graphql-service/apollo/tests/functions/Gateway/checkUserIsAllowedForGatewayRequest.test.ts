import { App } from "@/database/models/App";
import { Pricing, PricingAvailability } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { checkUserIsAllowedForGatewayRequest } from "@/functions/gateway";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { addMoneyForUser, baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import * as uuid from "uuid";

describe("checkUserIsAllowedForGatewayRequest", () => {
    let testRequestUser: User;
    let testAppOwner: User;
    let testApp: App;
    let testPricing: Pricing;
    beforeEach(async () => {
        testRequestUser = await getOrCreateTestUser(context);
        testAppOwner = await getOrCreateTestUser(context);
        testApp = await context.batched.App.createOverwrite({
            name: `testapp-${uuid.v4()}`,
            owner: UserPK.stringify(testAppOwner),
        });
        testPricing = await context.batched.Pricing.create({
            name: "test-pricing",
            app: AppPK.stringify(testApp),
            availability: PricingAvailability.Public,
            minMonthlyCharge: "10",
            chargePerRequest: "0.01",
            freeQuota: 0,
            callToAction: "test-call-to-action",
        });
    });

    test("Should allow when user has free quota and app owner has sufficient balance to cover the request", async () => {
        await addMoneyForUser(context, { user: UserPK.stringify(testAppOwner), amount: "100" });
        testPricing = await context.batched.Pricing.update(testPricing, { freeQuota: 1 });
        const result = checkUserIsAllowedForGatewayRequest(context, {
            requester: UserPK.stringify(testRequestUser),
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
        });
        await expect(result).resolves.toMatchObject({
            allowed: true,
            reason: null,
            pricingPK: PricingPK.stringify(testPricing),
            userPK: UserPK.stringify(testRequestUser),
        });
    });

    test("Should deny when app owner has insufficient balance to cover the request, even if user has free quota.", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, { freeQuota: 1 });
        const result = checkUserIsAllowedForGatewayRequest(context, {
            requester: UserPK.stringify(testRequestUser),
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
        });
        await expect(result).resolves.toMatchObject({
            allowed: false,
            reason: "owner_insufficient_balance",
            pricingPK: PricingPK.stringify(testPricing),
            userPK: UserPK.stringify(testRequestUser),
        });
    });

    test("Should deny when requester has insufficient balance and has no free quota.", async () => {
        const result = checkUserIsAllowedForGatewayRequest(context, {
            requester: UserPK.stringify(testRequestUser),
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
        });
        await expect(result).resolves.toMatchObject({
            allowed: false,
            reason: "insufficient_balance",
            pricingPK: PricingPK.stringify(testPricing),
            userPK: UserPK.stringify(testRequestUser),
        });
    });
});
