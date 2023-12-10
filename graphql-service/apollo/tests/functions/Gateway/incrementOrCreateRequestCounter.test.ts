import { User } from "@/database/models/User";
import { incrementOrCreateRequestCounter } from "@/functions/gateway";
import { UserPK } from "@/pks/UserPK";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils";
import { describe, expect, test } from "@jest/globals";

describe("incrementOrCreateRequestCounter", () => {
    let testUser: User;
    beforeEach(async () => {
        testUser = await getOrCreateTestUser(context);
    });

    test("Should create a new counter if it doesn't exist", async () => {
        const createOverwrite = jest.spyOn(context.batched.GatewayRequestCounter, "createOverwrite");
        const gatewayRequestCounter = await context.batched.GatewayRequestCounter.getOrNull({
            requester: UserPK.stringify(testUser),
        });
        expect(gatewayRequestCounter).toBeNull();
        await incrementOrCreateRequestCounter(context, {
            user: UserPK.stringify(testUser),
        });
        expect(createOverwrite).toHaveBeenCalledTimes(1);
        context.batched.GatewayRequestCounter.clearCache();
        const newGatewayRequestCounter = context.batched.GatewayRequestCounter.getOrNull({
            requester: UserPK.stringify(testUser),
        });
        await expect(newGatewayRequestCounter).resolves.toMatchObject({
            counter: 1,
            counterSinceLastReset: 1,
            lastResetTime: expect.any(Number),
        });
    });

    test("Should increment counter on each call", async () => {
        for (let i = 1; i <= 5; i++) {
            await incrementOrCreateRequestCounter(context, {
                user: UserPK.stringify(testUser),
            });
            context.batched.GatewayRequestCounter.clearCache();
            const gatewayRequestCounter = context.batched.GatewayRequestCounter.getOrNull({
                requester: UserPK.stringify(testUser),
            });
            await expect(gatewayRequestCounter).resolves.toMatchObject({
                counter: i,
                counterSinceLastReset: i,
            });
        }
    });

    test("Should reset counter when time passes requestCounterResetPeriodInSeconds", async () => {
        const user = UserPK.stringify(testUser);
        const requestCounterResetPeriodInSeconds = 3;
        const counter = await incrementOrCreateRequestCounter(context, {
            user,
            requestCounterResetPeriodInSeconds,
        });
        const fakeNow = counter.lastResetTime + requestCounterResetPeriodInSeconds * 1000;
        jest.spyOn(Date, "now").mockImplementation(() => fakeNow);
        const newCounter = await incrementOrCreateRequestCounter(context, {
            user,
            requestCounterResetPeriodInSeconds,
        });
        expect(newCounter).toMatchObject({
            counter: 2,
            counterSinceLastReset: 1,
            lastResetTime: fakeNow,
        });
    });
});
