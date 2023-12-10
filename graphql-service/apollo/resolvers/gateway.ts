import { GatewayDecisionResponseReason } from "@/__generated__/gql/graphql";
import {
    balanceCheckCanBeMadeAfterRequest,
    cacheGatewayDecisionForRequest,
    checkUserIsAllowedForGatewayRequest,
    incrementOrCreateRequestCounter,
} from "@/functions/gateway";
import { Chalk } from "chalk";
import { RequestContext } from "../RequestContext";
import {
    GQLGatewayDecisionResponseResolvers,
    GQLQueryCheckUserIsAllowedForGatewayRequestArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { findUserSubscription } from "../functions/subscription";
export const chalk = new Chalk({ level: 3 });

type GatewayDecisionAllowedResponse = {
    allowed: true;
    reason: null;
    pricingPK: string;
    userPK: string;
};

type GatewayDecisionDeniedResponse = {
    allowed: false;
    reason: GatewayDecisionResponseReason;
    pricingPK: string | null;
    userPK: string | null;
};

export type GatewayDecisionResponse = GatewayDecisionAllowedResponse | GatewayDecisionDeniedResponse;

export const GatewayResolvers: GQLResolvers & {
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
            parent: {},
            {
                user,
                app,
                _forceBalanceCheck = false,
                _forceAwait = false,
            }: GQLQueryCheckUserIsAllowedForGatewayRequestArgs,
            context: RequestContext
        ): Promise<GatewayDecisionResponse> {
            if (!context.isServiceRequest) {
                throw new Denied();
            }
            // let startTimer = Date.now();

            const globalRequestCounter = await incrementOrCreateRequestCounter(context, { user });

            // If the counter is too high since the last reset (which is 60s
            // ago), then deny the request.
            if (globalRequestCounter.counterSinceLastReset > 6000) {
                return {
                    allowed: false,
                    reason: GatewayDecisionResponseReason.TooManyRequests,
                    pricingPK: null,
                    userPK: user,
                };
            }

            const subscription = await findUserSubscription(context, { app, user });
            if (!subscription) {
                return {
                    allowed: false,
                    reason: GatewayDecisionResponseReason.NotSubscribed,
                    pricingPK: null,
                    userPK: user,
                };
            }

            // Get the decision cache, or create it if it doesn't exist. The
            // decision cash helps us decide whether we should check the user's
            // balance or not.
            const gatewayDecisionCache = await context.batched.GatewayRequestDecisionCache.getOrNull({
                requester: user,
                app,
                pricing: subscription.pricing,
            });

            if (
                !_forceBalanceCheck &&
                balanceCheckCanBeMadeAfterRequest({
                    gatewayDecisionCache,
                    globalRequestCounter,
                })
            ) {
                const promise = (async () => {
                    const response = await checkUserIsAllowedForGatewayRequest(context, {
                        requester: user,
                        app,
                        pricing: subscription.pricing,
                    });
                    await cacheGatewayDecisionForRequest(context, {
                        response,
                        app,
                        requester: user,
                        gatewayDecisionCache,
                        globalRequestCounter,
                        pricing: subscription.pricing,
                    });
                })();
                if (_forceAwait) {
                    await promise;
                }
                return {
                    allowed: true,
                    reason: null,
                    pricingPK: subscription.pricing,
                    userPK: user,
                };
            }

            const response = await checkUserIsAllowedForGatewayRequest(context, {
                requester: user,
                app,
                pricing: subscription.pricing,
            });

            const promise = cacheGatewayDecisionForRequest(context, {
                response,
                app,
                requester: user,
                gatewayDecisionCache,
                globalRequestCounter,
                pricing: subscription.pricing,
            });

            if (_forceAwait) {
                await promise;
            }

            return response;
        },
    },
    Mutation: {},
};
