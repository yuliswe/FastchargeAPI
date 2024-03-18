import { User } from "@/src/database/models/User";
import { incrementOrCreateRequestCounter } from "@/src/functions/gateway";
import { UserPK } from "@/src/pks/UserPK";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";

describe("incrementOrCreateRequestCounter", () => {
  let testUser: User;
  beforeEach(async () => {
    testUser = await getOrCreateTestUser(context);
  });

  test("Should create a new counter if it doesn't exist", async () => {
    const getOrCreateIfNotExists = jest.spyOn(context.batched.GatewayRequestCounter, "getOrCreateIfNotExists");
    const gatewayRequestCounter = await context.batched.GatewayRequestCounter.getOrNull({
      requester: UserPK.stringify(testUser),
    });
    expect(gatewayRequestCounter).toBeNull();
    await incrementOrCreateRequestCounter(context, {
      user: UserPK.stringify(testUser),
    });
    expect(getOrCreateIfNotExists).toHaveBeenCalledTimes(1);
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