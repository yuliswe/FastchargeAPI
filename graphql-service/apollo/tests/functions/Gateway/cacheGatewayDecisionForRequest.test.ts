import { GatewayDecisionResponseReason, PricingAvailability } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { GatewayRequestCounter } from "@/database/models/GatewayRequestCounter";
import { GatewayRequestDecisionCache } from "@/database/models/GatewayRequestDecisionCache";
import { Pricing } from "@/database/models/Pricing";
import { User } from "@/database/models/User";

import * as gatewayFunctions from "@/functions/gateway";
import { cacheGatewayDecisionForRequest } from "@/functions/gateway";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { GatewayDecisionResponse } from "@/resolvers/Gateway";
import { createTestApp } from "@/tests/test-utils/models/App";
import { createTestPricing } from "@/tests/test-utils/models/Pricing";
import { createTestUser } from "@/tests/test-utils/models/User";
import { addMoneyForUser, baseRequestContext as context } from "@/tests/test-utils/test-utils";
import Decimal from "decimal.js-light";

describe("cacheGatewayDecisionForRequest", () => {
  let testRequestUser: User;
  let testAppOwner: User;
  let testApp: App;
  let testGlobalRequestCounter: GatewayRequestCounter;
  let testPricing: Pricing;
  let testFrozenTime: number;

  beforeEach(async () => {
    testRequestUser = await createTestUser(context);
    testAppOwner = await createTestUser(context);
    testApp = await createTestApp(context, { owner: UserPK.stringify(testAppOwner) });
    testPricing = await createTestPricing(context, {
      app: AppPK.stringify(testApp),
      availability: PricingAvailability.Public,
      minMonthlyCharge: "10",
      chargePerRequest: "0.01",
      freeQuota: 0,
      callToAction: "test-call-to-action",
    });
    testGlobalRequestCounter = await context.batched.GatewayRequestCounter.create({
      requester: UserPK.stringify(testRequestUser),
      counter: 0,
      counterSinceLastReset: 0,
      lastResetTime: 0,
      app: AppPK.stringify(testApp),
    });
    testFrozenTime = Date.now();
    jest.spyOn(Date, "now").mockImplementation(() => testFrozenTime);
  });

  function getArgs(overwrite: {
    response: {
      allowed: boolean;
    };
    gatewayDecisionCache?: GatewayRequestDecisionCache | null;
  }) {
    return {
      response: {
        allowed: overwrite?.response?.allowed ?? false,
        reason: GatewayDecisionResponseReason.Unknown,
        pricingPK: PricingPK.stringify(testPricing),
        userPK: UserPK.stringify(testRequestUser),
      } as GatewayDecisionResponse,
      app: AppPK.stringify(testApp),
      requester: UserPK.stringify(testRequestUser),
      gatewayDecisionCache: overwrite?.gatewayDecisionCache ?? null,
      globalRequestCounter: testGlobalRequestCounter,
      pricing: PricingPK.stringify(testPricing),
    };
  }

  function getExpected(overwrite?: { nextForcedBalanceCheckRequestCount: number; nextForcedBalanceCheckTime: number }) {
    return {
      app: AppPK.stringify(testApp),
      nextForcedBalanceCheckRequestCount: overwrite?.nextForcedBalanceCheckRequestCount ?? 0,
      nextForcedBalanceCheckTime: overwrite?.nextForcedBalanceCheckTime ?? testFrozenTime,
      pricing: PricingPK.stringify(testPricing),
      requester: UserPK.stringify(testRequestUser),
    };
  }

  test("If response.allowed is false, must update so that balanceCheckCanBeMadeAfterRequest returns false", async () => {
    const gatewayDecisionCache = await context.batched.GatewayRequestDecisionCache.create({
      requester: UserPK.stringify(testRequestUser),
      app: AppPK.stringify(testApp),
      pricing: PricingPK.stringify(testPricing),
      nextForcedBalanceCheckRequestCount: 100,
      nextForcedBalanceCheckTime: testFrozenTime + 3600,
    });

    const promise = cacheGatewayDecisionForRequest(
      context,
      getArgs({
        response: {
          allowed: false,
        },
        gatewayDecisionCache,
      })
    );

    await expect(promise).resolves.toMatchObject(
      getExpected({
        nextForcedBalanceCheckRequestCount: 0,
        nextForcedBalanceCheckTime: testFrozenTime,
      })
    );
  });

  test('must create a new GatewayRequestDecisionCache if "gatewayDecisionCache" is null', async () => {
    await cacheGatewayDecisionForRequest(
      context,
      getArgs({
        response: {
          allowed: false,
        },
        gatewayDecisionCache: null,
      })
    );
    const createdGatewayDecisionCache = context.batched.GatewayRequestDecisionCache.getOrNull({
      requester: UserPK.stringify(testRequestUser),
      app: AppPK.stringify(testApp),
    });
    await expect(createdGatewayDecisionCache).resolves.toMatchObject(
      getExpected({
        nextForcedBalanceCheckRequestCount: 0,
        nextForcedBalanceCheckTime: testFrozenTime,
      })
    );
  });

  test("If response.allowed is true, should pass user and owner balances to estimateAllowanceToSkipBalanceCheck, and update the GatewayRequestDecisionCache based on the result", async () => {
    const estimateAllowanceToSkipBalanceCheck = jest
      .spyOn(gatewayFunctions, "estimateAllowanceToSkipBalanceCheck")
      .mockImplementation((_) => ({
        numChecksToSkip: 10,
        timeUntilNextCheckSeconds: 100,
      }));

    await addMoneyForUser(context, { user: UserPK.stringify(testRequestUser), amount: "100" });
    await addMoneyForUser(context, { user: UserPK.stringify(testAppOwner), amount: "200" });

    await cacheGatewayDecisionForRequest(
      context,
      getArgs({
        response: {
          allowed: true,
        },
      })
    );

    expect(estimateAllowanceToSkipBalanceCheck).toHaveBeenCalledTimes(1);
    expect(estimateAllowanceToSkipBalanceCheck.mock.calls[0][0]).toMatchObject({
      appOwnerBalance: new Decimal("200"),
      requestUserBalance: new Decimal("100"),
    });

    const updatedGatewayDecisionCache = context.batched.GatewayRequestDecisionCache.getOrNull({
      requester: UserPK.stringify(testRequestUser),
      app: AppPK.stringify(testApp),
    });

    await expect(updatedGatewayDecisionCache).resolves.toMatchObject(
      getExpected({
        nextForcedBalanceCheckRequestCount: 10, // matches numChecksToSkip
        nextForcedBalanceCheckTime: testFrozenTime + 100_000, // matches timeUntilNextCheckSeconds
      })
    );
  });
});
