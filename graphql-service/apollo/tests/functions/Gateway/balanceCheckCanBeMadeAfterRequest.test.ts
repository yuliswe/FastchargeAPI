import { App } from "@/database/models/App";
import { Pricing, PricingAvailability } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { balanceCheckCanBeMadeAfterRequest } from "@/functions/gateway";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import * as uuid from "uuid";

describe("balanceCheckCanBeMadeAfterRequest", () => {
    let testRequestUser: User;
    let testAppOwner: User;
    let testApp: App;
    let testPricing: Pricing;

    beforeEach(async () => {
        testRequestUser = await getOrCreateTestUser(context);
        testAppOwner = await getOrCreateTestUser(context);
        testApp = await context.batched.App.create({
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

    test("First balance check cannot be made after request", async () => {
        const result = balanceCheckCanBeMadeAfterRequest({
            gatewayDecisionCache: null,
            globalRequestCounter: await context.batched.GatewayRequestCounter.create({
                requester: UserPK.stringify(testRequestUser),
                counter: 0,
                counterSinceLastReset: 0,
                lastResetTime: 0,
                app: AppPK.stringify(testApp),
            }),
        });
        expect(result).toBe(false);
    });

    test("return true when not expired", async () => {
        const fakeTime = Date.now();
        jest.spyOn(Date, "now").mockImplementation(() => fakeTime);

        const result = balanceCheckCanBeMadeAfterRequest({
            gatewayDecisionCache: await context.batched.GatewayRequestDecisionCache.create({
                requester: UserPK.stringify(testRequestUser),
                app: AppPK.stringify(testApp),
                pricing: PricingPK.stringify(testPricing),
                nextForcedBalanceCheckRequestCount: 1,
                nextForcedBalanceCheckTime: fakeTime + 1,
            }),
            globalRequestCounter: await context.batched.GatewayRequestCounter.create({
                requester: UserPK.stringify(testRequestUser),
                counter: 0,
                counterSinceLastReset: 0,
                lastResetTime: 0,
                app: AppPK.stringify(testApp),
            }),
        });
        expect(result).toBe(true);
    });

    test("gatewayDecisionCache has expired nextForcedBalanceCheckTime should return false", async () => {
        const fakeTime = Date.now();
        jest.spyOn(Date, "now").mockImplementation(() => fakeTime);

        const result = balanceCheckCanBeMadeAfterRequest({
            gatewayDecisionCache: await context.batched.GatewayRequestDecisionCache.create({
                requester: UserPK.stringify(testRequestUser),
                app: AppPK.stringify(testApp),
                pricing: PricingPK.stringify(testPricing),
                nextForcedBalanceCheckRequestCount: 1000,
                nextForcedBalanceCheckTime: fakeTime,
            }),
            globalRequestCounter: await context.batched.GatewayRequestCounter.create({
                requester: UserPK.stringify(testRequestUser),
                counter: 0,
                counterSinceLastReset: 0,
                lastResetTime: 0,
                app: AppPK.stringify(testApp),
            }),
        });
        expect(result).toBe(false);
    });

    test("gatewayDecisionCache has expired nextForcedBalanceCheckRequestCount should return false", async () => {
        const fakeTime = Date.now();
        jest.spyOn(Date, "now").mockImplementation(() => fakeTime);

        const result = balanceCheckCanBeMadeAfterRequest({
            gatewayDecisionCache: await context.batched.GatewayRequestDecisionCache.create({
                requester: UserPK.stringify(testRequestUser),
                app: AppPK.stringify(testApp),
                pricing: PricingPK.stringify(testPricing),
                nextForcedBalanceCheckRequestCount: 1000,
                nextForcedBalanceCheckTime: fakeTime + 100,
            }),
            globalRequestCounter: await context.batched.GatewayRequestCounter.create({
                requester: UserPK.stringify(testRequestUser),
                counter: 1000,
                counterSinceLastReset: 0,
                lastResetTime: 0,
                app: AppPK.stringify(testApp),
            }),
        });
        expect(result).toBe(false);
    });
});
