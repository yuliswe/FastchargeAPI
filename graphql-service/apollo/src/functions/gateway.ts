import { RequestContext } from "@/src/RequestContext";
import { GatewayDecisionResponseReason, SiteMetaDataKey } from "@/src/__generated__/resolvers-types";
import { GatewayRequestCounter } from "@/src/database/models/GatewayRequestCounter";
import { GatewayRequestDecisionCache } from "@/src/database/models/GatewayRequestDecisionCache";
import { Pricing } from "@/src/database/models/Pricing";
import { PK } from "@/src/database/utils";
import { NotFound } from "@/src/errors";
import { getUserBalance } from "@/src/functions/account";
import { shouldCollectMonthlyCharge } from "@/src/functions/billing";
import { getSiteMetaDataOrDefault } from "@/src/functions/site";
import { AppPK } from "@/src/pks/AppPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { GatewayDecisionResponse } from "@/src/resolvers/Gateway";
import Decimal from "decimal.js-light";

/**
 * Increments the request counter for the user, and creates the counter if it
 * doesn already exist. Resets the timer every 60s, as a way to check the
 * frequency of requests from the user.
 */
export async function incrementOrCreateRequestCounter(
  context: RequestContext,
  args: { user: string; requestCounterResetPeriodInSeconds?: number }
): Promise<GatewayRequestCounter> {
  const { user, requestCounterResetPeriodInSeconds = 60 } = args;
  let counter: GatewayRequestCounter | undefined;
  try {
    counter = await context.batched.GatewayRequestCounter.update(
      {
        requester: user,
        app: "<global>",
      },
      {
        $ADD: {
          counter: 1,
          counterSinceLastReset: 1,
        },
      }
    );
  } catch (e) {
    if (e instanceof NotFound) {
      return await context.batched.GatewayRequestCounter.createOverwrite({
        requester: user,
        app: "<global>",
        isGlobalCounter: true,
        counter: 1,
        counterSinceLastReset: 1,
        lastResetTime: Date.now(),
      });
    }
    throw e;
  }

  if (Date.now() - counter.lastResetTime >= 1000 * requestCounterResetPeriodInSeconds) {
    counter = await context.batched.GatewayRequestCounter.update(counter, {
      lastResetTime: Date.now(),
      counterSinceLastReset: 1,
    });
  }

  return counter;
}

export function balanceCheckCanBeMadeAfterRequest({
  gatewayDecisionCache,
  globalRequestCounter,
}: {
  gatewayDecisionCache: GatewayRequestDecisionCache | null;
  globalRequestCounter: GatewayRequestCounter;
}): boolean {
  if (!gatewayDecisionCache) {
    return false;
  }
  const { nextForcedBalanceCheckRequestCount, nextForcedBalanceCheckTime } = gatewayDecisionCache;
  const { counter } = globalRequestCounter;
  return nextForcedBalanceCheckRequestCount > counter && nextForcedBalanceCheckTime > Date.now();
}

export async function cacheGatewayDecisionForRequest(
  context: RequestContext,
  args: {
    response: GatewayDecisionResponse;
    requester: PK;
    app: PK;
    pricing: PK;
    gatewayDecisionCache: GatewayRequestDecisionCache | null;
    globalRequestCounter: GatewayRequestCounter;
  }
) {
  const { response, app, requester, gatewayDecisionCache, globalRequestCounter, pricing } = args;
  if (response.allowed) {
    const [decision, platformFee, pricingObject, appObject, requestUserBalance] = await Promise.all([
      gatewayDecisionCache
        ? Promise.resolve(gatewayDecisionCache)
        : context.batched.GatewayRequestDecisionCache.create({
            requester,
            app,
            pricing,
            nextForcedBalanceCheckRequestCount: 0,
            nextForcedBalanceCheckTime: 0,
          }), // decision
      getSiteMetaDataOrDefault(context, SiteMetaDataKey.PerRequestCharge).then((x) => new Decimal(x.value as string)), // platformFee
      context.batched.Pricing.get(PricingPK.parse(pricing)), // pricingObject
      context.batched.App.get(AppPK.parse(app)), // appObject
      getUserBalance(context, requester).then((v) => new Decimal(v)), // requestUserBalance
    ]);
    const [appOwnerBalance] = await Promise.all([
      getUserBalance(context, appObject.owner).then((v) => new Decimal(v)), // appOwnerBalance
    ]);
    const { numChecksToSkip, timeUntilNextCheckSeconds } = estimateAllowanceToSkipBalanceCheck({
      appOwnerBalance,
      requestUserBalance,
      pricing: pricingObject,
      platformFee,
    });
    return await context.batched.GatewayRequestDecisionCache.update(decision, {
      nextForcedBalanceCheckRequestCount: globalRequestCounter.counter + numChecksToSkip,
      nextForcedBalanceCheckTime: Date.now() + 1000 * timeUntilNextCheckSeconds, // 1 hour from now
    });
  } else {
    const decision = gatewayDecisionCache
      ? gatewayDecisionCache
      : await context.batched.GatewayRequestDecisionCache.create({
          requester,
          app,
          pricing,
          nextForcedBalanceCheckRequestCount: 0,
          nextForcedBalanceCheckTime: 0,
        });
    return await context.batched.GatewayRequestDecisionCache.update(decision, {
      nextForcedBalanceCheckRequestCount: globalRequestCounter.counter,
      nextForcedBalanceCheckTime: Date.now(),
    });
  }
}

export async function checkUserIsAllowedForGatewayRequest(
  context: RequestContext,
  args: {
    requester: PK;
    app: PK;
    pricing: PK;
  }
): Promise<GatewayDecisionResponse> {
  const { requester, app, pricing } = args;
  const [appObject, pricingObject, platformFee, userBalance] = await Promise.all([
    context.batched.App.get(AppPK.parse(app)), // appObject
    context.batched.Pricing.get(PricingPK.parse(pricing)), // pricingObject
    getSiteMetaDataOrDefault(context, SiteMetaDataKey.PerRequestCharge).then((x) => new Decimal(x.value as string)), // platformFee
    getUserBalance(context, requester), // userBalance
  ]);
  const [requesterHasFreeQuota, collectMonthlyCharge, appOwnerBalance] = await Promise.all([
    checkHasSufficientFreeQuota(context, { app, user: requester, pricing: pricingObject }), // requesterHasFreeQuota
    shouldCollectMonthlyCharge(context, {
      app,
      subscriber: requester,
      pricing: pricingObject,
      volumeBillable: 1,
    }), // collectMonthlyCharge
    getUserBalance(context, appObject.owner).then((v) => new Decimal(v)), // appOwnerBalance
  ]);
  const requesterHasSufficientBalance = checkHasSufficientBalance({
    userBalance: new Decimal(userBalance),
    shouldCollectMonthlyCharge: collectMonthlyCharge.shouldBill,
    pricing: pricingObject,
  });
  const appOwnerHasSufficientBalance = checkOwnerHasSufficientBalance(context, {
    requesterHasFreeQuota,
    appOwnerBalance,
    pricing: pricingObject,
    platformFee,
  });

  // Does the API caller have enough free quota to cover this request?
  if (requesterHasFreeQuota) {
    // If the request user has sufficient free quota, check if the
    // app owner has sufficient balance to cover this request
    if (!appOwnerHasSufficientBalance) {
      return {
        allowed: false,
        reason: GatewayDecisionResponseReason.OwnerInsufficientBalance,
        pricingPK: pricing,
        userPK: requester,
      };
    }
  } else if (!requesterHasSufficientBalance) {
    // If the request user does not have sufficient free quota, does
    // it have enough balance to cover this request?
    return {
      allowed: false,
      reason: GatewayDecisionResponseReason.InsufficientBalance,
      pricingPK: pricing,
      userPK: requester,
    };
  }
  // {
  //     let stopTimer = Date.now();
  //     console.log(chalk.magenta(`checkUserIsAllowedForGatewayRequest took ${stopTimer - startTimer}ms`));
  // }
  return {
    allowed: true,
    reason: null,
    pricingPK: pricing,
    userPK: requester,
  };
}

async function checkHasSufficientFreeQuota(
  context: RequestContext,
  args: { app: PK; user: PK; pricing: Pricing }
): Promise<boolean> {
  const { app, user, pricing } = args;
  const quota = await context.batched.FreeQuotaUsage.createOverwrite({
    subscriber: user,
    app,
  });
  return quota.usage < pricing.freeQuota;
}

/**
 * Checks whether the api caller has sufficient balance to cover the request,
 * assuming the request fee is charged to the api caller. This include the
 * monthly fee as well as the per-request fee.
 *
 * @returns true if the api caller has sufficient balance. false otherwise. undefined
 * if the user is not subscribed or user does not exist.
 */
function checkHasSufficientBalance(args: {
  userBalance: Decimal;
  shouldCollectMonthlyCharge: boolean;
  pricing: Pricing;
}): boolean {
  const { userBalance, shouldCollectMonthlyCharge, pricing } = args;
  let cost = new Decimal(pricing.chargePerRequest);
  if (shouldCollectMonthlyCharge) {
    cost = cost.add(pricing.minMonthlyCharge);
  }
  return userBalance.greaterThanOrEqualTo(cost);
}

/**
 * Checks whether the app owner has sufficient balance to cover the request.
 * When the app owner charges the request for an amount that is >= than our
 * platform fee, the owner has sufficient balance because we take the platform
 * fee from the request charge. If the request charge is < than our platform fee
 * or when free quota is used, then the owner needs to have sufficient balance
 * to cover the request.
 */
function checkOwnerHasSufficientBalance(
  context: RequestContext,
  args: {
    platformFee: Decimal;
    requesterHasFreeQuota: boolean;
    appOwnerBalance: Decimal;
    pricing: Pricing;
  }
): boolean {
  const { platformFee, requesterHasFreeQuota, appOwnerBalance, pricing } = args;
  if (requesterHasFreeQuota) {
    return appOwnerBalance.gte(platformFee);
  }
  const chargePerRequest = new Decimal(pricing.chargePerRequest);
  const chargeToAppOwner = Math.min(chargePerRequest.minus(platformFee).toNumber(), 0);
  return appOwnerBalance.gte(chargeToAppOwner);
}

type EstimateAllowanceToSkipBalanceCheckResult = {
  numChecksToSkip: number;
  timeUntilNextCheckSeconds: number;
};

/**
 * Returns an estimate of how many requests the user can make without the
 * balance being checked, using an heuristic.
 */
export const estimateAllowanceToSkipBalanceCheck = (args: {
  appOwnerBalance: Decimal;
  requestUserBalance: Decimal;
  pricing: Pricing;
  platformFee: Decimal;
}): EstimateAllowanceToSkipBalanceCheckResult => {
  const { appOwnerBalance, requestUserBalance, pricing, platformFee } = args;
  // Heuristic: take the user's balance, substract the monthly charge, and
  // devide by the request charge, and divide by 100.
  const maxRequests = Math.max(
    0,
    requestUserBalance.minus(pricing.minMonthlyCharge).div(pricing.chargePerRequest).div(100).toInteger().toNumber()
  );
  // Another heuristic: get app owner's balance, divide by the per-request fee
  // we charge, and divide by 10000.
  const maxRequestsForAppOwner = appOwnerBalance.div(platformFee).div(1000).toInteger().toNumber();
  // Take the minimum of the two values, and limit to 100.
  const numChecksToSkip = Math.min(maxRequests, maxRequestsForAppOwner, 100);
  return {
    numChecksToSkip,
    timeUntilNextCheckSeconds: 60 * 60, // 1 hour
  };
};
