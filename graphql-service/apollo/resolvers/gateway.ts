import { RequestContext } from "../RequestContext";
import {
    GQLGatewayDecisionResponse,
    GQLGatewayDecisionResponseReason,
    GQLGatewayDecisionResponseResolvers,
    GQLPricing,
    GQLQueryCheckUserIsAllowedForGatewayRequestArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { getUserBalance } from "../functions/account";
import { findUserSubscriptionPricing } from "../functions/subscription";
import { ShouldCollectMonthlyChargePromiseResult, shouldCollectMonthlyCharge } from "../functions/billing";
import { getAppAuthorUser } from "../functions/app";
import Decimal from "decimal.js-light";
import {
    GatewayRequestCounter,
    GatewayRequestCounterModel,
    GatewayRequestDecisionCache,
    Pricing,
    disableDBLogging,
    enableDBLogging,
} from "../dynamoose/models";
import { Chalk } from "chalk";
import dynamoose from "dynamoose";
import { AlreadyExists, NotFound } from "../errors";
const chalk = new Chalk({ level: 3 });

export const gatewayResolvers: GQLResolvers & {
    Query: GQLGatewayDecisionResponseResolvers;
} = {
    Query: {
        /**
         * Used by the Gateway service to check whether the api caller is
         * allowed to access an endpoint, depending on the app's pricing plan,
         * the api caller's balance, and in case of using free quota, the api
         * author's balance.
         */
        async checkUserIsAllowedForGatewayRequest(
            parent: GQLQueryCheckUserIsAllowedForGatewayRequestArgs,
            { user, app, forceBalanceCheck }: GQLQueryCheckUserIsAllowedForGatewayRequestArgs,
            context: RequestContext
        ) {
            // let startTimer = Date.now();

            // Increment the request counter, or create it if it doesn't exist
            let globalRequestCounterPromise = incrementOrCreateRequestCounter(context, { user });

            // Get the decision cache, or create it if it doesn't exist. The
            // decision cash helps us decide whether we should check the user's
            // balance or not.
            let gatewayDecisionCachePromise = getGatewayDecisionCache(context, {
                user,
                app,
                globalRequestCounterPromise,
            });

            let globalRequestCounter = await globalRequestCounterPromise;

            // Handle the above race condition
            if (globalRequestCounter === null) {
                return { allowed: false, reason: GQLGatewayDecisionResponseReason.TooManyRequests };
            }

            // If the counter is too high since the last reset (which is 60s
            // ago), then deny the request.
            if (globalRequestCounter.counterSinceLastReset > 6000) {
                return { allowed: false, reason: GQLGatewayDecisionResponseReason.TooManyRequests };
            }

            let gatewayDecisionCache = await gatewayDecisionCachePromise;

            // Handle the above race condition
            if (gatewayDecisionCache === null) {
                return { allowed: false, reason: GQLGatewayDecisionResponseReason.TooManyRequests };
            }

            // Check if the account balance check can be skipped
            if (
                !forceBalanceCheck &&
                gatewayDecisionCache.nextForcedBalanceCheckRequestCount > globalRequestCounter.counter &&
                gatewayDecisionCache.nextForcedBalanceCheckTime > Date.now()
            ) {
                // {
                //     let stopTimer = Date.now();
                //     console.log(
                //         "checkUserIsAllowedForGatewayRequest (skipped balance check) took",
                //         stopTimer - startTimer,
                //         "ms"
                //     );
                // }
                return { allowed: true, reason: null };
            }

            // If the balance check cannot be skipped, recompute the decision,
            // to try to make more allowance for the next request.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            createOrUpdateGatewayDecisionCache(context, { user, app, globalRequestCounterPromise });

            // Run all these promises concurrently
            let pricingPromise = findUserSubscriptionPricing(context, { app, user });
            let shouldCollectMonthlyChargePromise = checkShouldChargeMonthlyFee(context, { app, user, pricingPromise });
            let hasSufficientFreeQuotaPromise = checkHasSufficientFreeQuota(context, { app, user });
            let hasSufficientBalancePromise = checkHasSufficientBalance(context, {
                app,
                user,
                shouldCollectMonthlyChargePromise,
            });
            let ownerHasSufficientBalancePromise = checkOwnerHasSufficientBalance(context, {
                app,
                user,
                shouldCollectMonthlyChargePromise,
            });
            let userIsSubscribedPromise = checkUserIsSubscribed(context, { pricingPromise });

            let userIsSubscribed = await userIsSubscribedPromise;
            let hasSufficientFreeQuota = await hasSufficientFreeQuotaPromise;
            let hasSufficientBalance = await hasSufficientBalancePromise;
            let ownerHasSufficientBalance = await ownerHasSufficientBalancePromise;
            let pricing = await pricingPromise;

            if (!userIsSubscribed) {
                return {
                    allowed: false,
                    reason: GQLGatewayDecisionResponseReason.NotSubscribed,
                    pricing: null,
                };
            }

            // Does the API caller have enough free quota to cover this request?
            if (hasSufficientFreeQuota) {
                // If the request user has sufficient free quota, check if the
                // app owner has sufficient balance to cover this request
                if (!ownerHasSufficientBalance) {
                    return {
                        allowed: false,
                        reason: GQLGatewayDecisionResponseReason.OwnerInsufficientBalance,
                        pricing: pricing,
                    };
                }
            } else if (!hasSufficientBalance) {
                // If the request user does not have sufficient free quota, does
                // it have enough balance to cover this request?
                return {
                    allowed: false,
                    reason: GQLGatewayDecisionResponseReason.InsufficientBalance,
                    pricing: pricing,
                };
            }
            // {
            //     let stopTimer = Date.now();
            //     console.log(chalk.magenta(`checkUserIsAllowedForGatewayRequest took ${stopTimer - startTimer}ms`));
            // }
            return {
                allowed: true,
                reason: null,
                pricing: pricing,
            };
        },
    },
    Mutation: {},
};

async function checkHasSufficientFreeQuota(context: RequestContext, { app, user }: { app: string; user: string }) {
    return await Promise.resolve(true);
}

/**
 * Checks whether the api caller has sufficient balance to cover the request,
 * assuming the request fee is charged to the api caller. This include the
 * monthly fee as well as the per-request fee.
 *
 * @returns true if the api caller has sufficient balance. false otherwise. undefined
 * if the user is not subscribed.
 */
async function checkHasSufficientBalance(
    context: RequestContext,
    {
        app,
        user,
        shouldCollectMonthlyChargePromise,
    }: {
        app: string;
        user: string;
        shouldCollectMonthlyChargePromise: Promise<ShouldCollectMonthlyChargePromiseResult | null>;
    }
): Promise<boolean | null> {
    let balancePromise = getUserBalance(context, user);
    let pricingPromise = findUserSubscriptionPricing(context, { user, app });
    let needMonthlyFeePromise = shouldCollectMonthlyChargePromise.then((r) => r && r.shouldBill);

    let pricing = await pricingPromise;
    let balance = await balancePromise;
    let needMonthlyFee = await needMonthlyFeePromise;

    if (pricing == null) {
        return null;
    }
    if (needMonthlyFee == null) {
        return null;
    }
    let cost = pricing.chargePerRequest;
    if (needMonthlyFee) {
        cost += pricing.minMonthlyCharge;
    }
    return balance >= cost;
}

/**
 * Checks whether the app owner has sufficient balance to cover the request,
 * assuming the request fee is charged to the app owner. This is the case when
 * the owner offers free quota for the app.
 *
 * @returns true if the app owner has sufficient balance, null if the user is
 * not subscribed.
 */
async function checkOwnerHasSufficientBalance(
    context: RequestContext,
    {
        app,
        user,
        shouldCollectMonthlyChargePromise,
    }: {
        app: string;
        user: string;
        shouldCollectMonthlyChargePromise: Promise<ShouldCollectMonthlyChargePromiseResult | null>;
    }
): Promise<boolean | null> {
    let balancePromise = context.batched.App.get({ name: app }).then((app) => getUserBalance(context, app.owner));
    let amountPromise = shouldCollectMonthlyChargePromise.then((x) => x && x.amount);
    let amount = await amountPromise;
    if (amount == null) {
        return null;
    }
    let balance = await balancePromise;
    return new Decimal(balance).gte(amount);
}

/**
 * @returns true if the user is subscribed to the app, false otherwise.
 */
async function checkUserIsSubscribed(
    context: RequestContext,
    { pricingPromise }: { pricingPromise: Promise<Pricing | null> }
) {
    let pricing = await pricingPromise;
    return pricing != null;
}

/**
 * @returns ShouldCollectMonthlyChargePromiseResult from
 * shouldCollectMonthlyCharge(), or null if the user is not subscribed to the
 * app.
 */
async function checkShouldChargeMonthlyFee(
    context: RequestContext,
    { app, user, pricingPromise }: { app: string; user: string; pricingPromise: Promise<Pricing | null> }
): Promise<ShouldCollectMonthlyChargePromiseResult | null> {
    let pricing = await pricingPromise;
    if (pricing == null) {
        return null;
    }
    return await shouldCollectMonthlyCharge(context, {
        app,
        subscriber: user,
        pricing,
    });
}

/**
 * Returns the GatewayDecisionCache for the user, and creates if it doesn't
 * exist. The creation can fail in the case two requests are made at the same.
 * In that case, returns null.
 * @returns GatewayDecisionCache, or null if the cache doesn't exist and cannot
 * be created.
 */
async function getGatewayDecisionCache(
    context: RequestContext,
    {
        user,
        app,
        globalRequestCounterPromise,
    }: { user: string; app: string; globalRequestCounterPromise: Promise<GatewayRequestCounter | null> }
): Promise<GatewayRequestDecisionCache | null> {
    return await context.batched.GatewayRequestDecisionCache.getOrNull({
        requester: user,
        app: "<global>",
    }).then(async (decisionCache) => {
        // Create the decision cache if it doesn't exist
        if (decisionCache === null) {
            try {
                return await createOrUpdateGatewayDecisionCache(context, { user, app, globalRequestCounterPromise });
            } catch (e) {
                if (e instanceof AlreadyExists) {
                    return null;
                }
                throw e;
            }
        } else {
            return decisionCache;
        }
    });
}

/**
 * Creates or updates the GatewayDecisionCache for the user. The function can
 * fail if it is invoked from two workers at the same time, in which case it
 * will return null.
 *
 * @globalRequestCounterPromise expects a promise that resolves to the global
 * GatewayRequestCounter for the current user. If the promise resolves to null,
 * returns null.
 * @returns GatewayDecisionCache, or null on error.
 */
async function createOrUpdateGatewayDecisionCache(
    context: RequestContext,
    {
        user,
        app,
        globalRequestCounterPromise,
    }: { user: string; app: string; globalRequestCounterPromise: Promise<GatewayRequestCounter | null> }
): Promise<GatewayRequestDecisionCache | null> {
    let startTimer = Date.now();

    let currentRequestCounter = await globalRequestCounterPromise;
    if (currentRequestCounter == null) {
        return null;
    }
    let { numChecksToSkip, timeUntilNextCheckSeconds } = await estimateAllowanceToSkipBalanceCheck(context, {
        app,
        user,
    });
    let decision = await context.batched.GatewayRequestDecisionCache.getOrNull({
        requester: user,
        app: "<global>",
    });
    if (decision === null) {
        try {
            // If two workers try to create the decision cache at the same time,
            // one of them will fail, and return null.
            decision = await context.batched.GatewayRequestDecisionCache.create({
                requester: user,
                app: "<global>",
                useGlobalCounter: true,
                nextForcedBalanceCheckRequestCount: currentRequestCounter.counter + numChecksToSkip,
                nextForcedBalanceCheckTime: Date.now() + 1000 * timeUntilNextCheckSeconds, // 1 hour from now
            });
        } catch (e) {
            if (e instanceof AlreadyExists) {
                return null;
            }
            throw e;
        }
    } else {
        decision = await context.batched.GatewayRequestDecisionCache.update(decision, {
            nextForcedBalanceCheckRequestCount: currentRequestCounter.counter + numChecksToSkip,
            nextForcedBalanceCheckTime: Date.now() + 1000 * timeUntilNextCheckSeconds, // 1 hour from now
        });
    }

    let stopTimer = Date.now();
    console.log(chalk.magenta(`createOrUpdateGatewayDecisionCache took ${stopTimer - startTimer}ms`));
    return decision;
}

type EstimateAllowanceToSkipBalanceCheckResult = {
    numChecksToSkip: number;
    timeUntilNextCheckSeconds: number;
};

/**
 * Returns an estimate of how many requests the user can make without the
 * balance being checked.
 */
async function estimateAllowanceToSkipBalanceCheck(
    context: RequestContext,
    { app, user }: { app: string; user: string }
): Promise<EstimateAllowanceToSkipBalanceCheckResult> {
    return await Promise.resolve({
        numChecksToSkip: 100,
        timeUntilNextCheckSeconds: 60 * 60, // 1 hour
    });
}

/**
 * Increments the request counter for the user, and creates the counter if it
 * doesn already exist. Resets the timer every 60s, as a way to check the
 * frequency of requests from the user.
 */
async function incrementOrCreateRequestCounter(
    context: RequestContext,
    { user }: { user: string }
): Promise<GatewayRequestCounter | null> {
    let counterPromise = context.batched.GatewayRequestCounter.update(
        {
            requester: user,
            app: "<global>",
        },
        {
            $ADD: {
                counter: 1,
                counterSinceLastReset: 1,
            },
            $SET: {
                isGlobalCounter: true,
            },
        }
    ).catch(async (e) => {
        // Note that it is observed that the update operation above
        // creates the record if it doesn't exist. So this catch block
        // is not really needed.
        if (e instanceof NotFound) {
            try {
                return await context.batched.GatewayRequestCounter.create({
                    requester: user,
                    app: "<global>",
                    isGlobalCounter: true,
                });
            } catch (e) {
                // In a race condition, if the user sents two requests at
                // the same time, the first one will create the record, and
                // the second one will fail. This will only happen once per
                // user, as the record will be created after that.
                if (e instanceof AlreadyExists) {
                    return null;
                } else {
                    throw e;
                }
            }
        }
        throw e;
    });

    // If the counter should be reset, then reset it, but do it without
    // await. We reset the counter every 60 seconds.
    void counterPromise.then(async (counter) => {
        if (counter == null) {
            return;
        }
        if (counter.lastResetTime < Date.now() - 1000 * 60) {
            // Reset the counter, don't wait for it to complete
            await context.batched.GatewayRequestCounter.update(counter, {
                $SET: {
                    lastResetTime: Date.now(),
                    counterSinceLastReset: 0,
                },
            });
        }
    });

    return counterPromise;
}
