import { App } from "@/database/models/App";
import { Pricing, PricingAvailability } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { estimateAllowanceToSkipBalanceCheck } from "@/functions/gateway";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import Decimal from "decimal.js-light";
import * as uuid from "uuid";

describe("estimateAllowanceToSkipBalanceCheck", () => {
    let testAppOwner: User;
    let testApp: App;
    let testPricing: Pricing;
    beforeEach(async () => {
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

    test("User has no balance, need to check every time", () => {
        const result = estimateAllowanceToSkipBalanceCheck({
            appOwnerBalance: new Decimal("0"),
            requestUserBalance: new Decimal("0"),
            pricing: testPricing,
            platformFee: new Decimal("0.1"),
        });
        expect(result).toMatchObject({
            numChecksToSkip: 0,
            timeUntilNextCheckSeconds: 3600,
        });
    });

    test("User has just enough balance to cover monthly fee", () => {
        const result = estimateAllowanceToSkipBalanceCheck({
            appOwnerBalance: new Decimal("100"),
            requestUserBalance: new Decimal("11"),
            pricing: testPricing,
            platformFee: new Decimal("0.001"),
        });
        expect(result).toMatchObject({
            numChecksToSkip: 1,
            timeUntilNextCheckSeconds: 3600,
        });
    });

    test("User has low balance", () => {
        const result = estimateAllowanceToSkipBalanceCheck({
            appOwnerBalance: new Decimal("100"),
            requestUserBalance: new Decimal("20"),
            pricing: testPricing,
            platformFee: new Decimal("0.001"),
        });
        expect(result).toMatchObject({
            numChecksToSkip: 10,
            timeUntilNextCheckSeconds: 3600,
        });
    });

    test("User high low balance", () => {
        const result = estimateAllowanceToSkipBalanceCheck({
            appOwnerBalance: new Decimal("100"),
            requestUserBalance: new Decimal("100"),
            pricing: testPricing,
            platformFee: new Decimal("0.001"),
        });
        expect(result).toMatchObject({
            numChecksToSkip: 90,
            timeUntilNextCheckSeconds: 3600,
        });
    });

    test("App owner has low balance", () => {
        const result = estimateAllowanceToSkipBalanceCheck({
            appOwnerBalance: new Decimal("10"),
            requestUserBalance: new Decimal("100"),
            pricing: testPricing,
            platformFee: new Decimal("0.001"),
        });
        expect(result).toMatchObject({
            numChecksToSkip: 10,
            timeUntilNextCheckSeconds: 3600,
        });
    });

    test("Average scenario", () => {
        const result = estimateAllowanceToSkipBalanceCheck({
            appOwnerBalance: new Decimal("20"),
            requestUserBalance: new Decimal("20"),
            pricing: testPricing,
            platformFee: new Decimal("0.001"),
        });
        expect(result).toMatchObject({
            numChecksToSkip: 10,
            timeUntilNextCheckSeconds: 3600,
        });
    });
});
