import { GatewayDecisionResponseReason } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { Pricing, PricingAvailability } from "@/database/models/Pricing";
import { Subscription } from "@/database/models/Subscription";
import { User } from "@/database/models/User";
import * as gatewayFunctions from "@/functions/gateway";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { GatewayDecisionResponse } from "@/resolvers/Gateway";
import { createTestGatewayRequestCounter } from "@/tests/test-utils/models/GatewayRequestCounter";
import { createTestGatewayRequestDecisionCache } from "@/tests/test-utils/models/GatewayRequestDecisionCache";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import * as uuid from "uuid";

const balanceCheckCanBeMadeAfterRequestSpy = () => jest.spyOn(gatewayFunctions, "balanceCheckCanBeMadeAfterRequest");
const checkUserIsAllowedForGatewayRequestSpy = () =>
    jest.spyOn(gatewayFunctions, "checkUserIsAllowedForGatewayRequest");
const cacheGatewayDecisionForRequestSpy = () => jest.spyOn(gatewayFunctions, "cacheGatewayDecisionForRequest");
const onIncrementOrCreateRequestCounterSpy = () => jest.spyOn(gatewayFunctions, "incrementOrCreateRequestCounter");

describe("checkUserIsAllowedForGatewayRequest", () => {
    let testAppOwner: User;
    let testApp: App;
    let testPricing: Pricing;
    let testSubscriber: User;
    let testSubscription: Subscription;

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context);
        testSubscriber = await getOrCreateTestUser(context);
        testApp = await context.batched.App.create({
            name: `testapp-${uuid.v4()}`,
            owner: UserPK.stringify(testAppOwner),
        });
        testPricing = await context.batched.Pricing.create({
            name: "test-pricing",
            app: AppPK.stringify(testApp),
            availability: PricingAvailability.Public,
            minMonthlyCharge: "0",
            chargePerRequest: "0",
            freeQuota: 0,
            callToAction: "test-call-to-action",
        });
        testSubscription = await context.batched.Subscription.create({
            app: AppPK.stringify(testApp),
            subscriber: UserPK.stringify(testSubscriber),
            pricing: PricingPK.stringify(testPricing),
        });
    });

    const queryCheckUserIsAllowedForGatewayRequest = graphql(`
        mutation TestCheckUserIsAllowedForGatewayRequest($app: ID!, $user: ID!, $_forceAwait: Boolean!) {
            checkUserIsAllowedForGatewayRequest(app: $app, user: $user, _forceAwait: $_forceAwait) {
                allowed
                reason
                userPK
                pricingPK
            }
        }
    `);

    function getVariables() {
        return {
            app: AppPK.stringify(testApp),
            user: UserPK.stringify(testSubscriber),
            _forceAwait: true,
        };
    }

    function getExpected(overwrite: {
        allowed?: boolean;
        reason?: GatewayDecisionResponseReason | null;
        pricingPK?: string | null;
    }) {
        return {
            data: {
                checkUserIsAllowedForGatewayRequest: {
                    __typename: "GatewayDecisionResponse",
                    userPK: UserPK.stringify(testSubscriber),
                    pricingPK: PricingPK.stringify(testPricing),
                    ...overwrite,
                },
            },
        };
    }

    test("Can only be called from service", async () => {
        const promise = getTestGQLClient({ isServiceRequest: false }).mutate({
            mutation: queryCheckUserIsAllowedForGatewayRequest,
            variables: getVariables(),
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "checkUserIsAllowedForGatewayRequest",
            },
        ]);
    });

    test("Should reject if user is not subscribed to the app", async () => {
        await context.batched.Subscription.delete(testSubscription);
        const promise = getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: queryCheckUserIsAllowedForGatewayRequest,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(
            getExpected({ allowed: false, reason: GatewayDecisionResponseReason.NotSubscribed, pricingPK: null })
        );
    });

    test("Should deny if there are too many requests", async () => {
        onIncrementOrCreateRequestCounterSpy().mockImplementation(() =>
            createTestGatewayRequestCounter(context, { counterSinceLastReset: 99999999 })
        );
        const promise = getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: queryCheckUserIsAllowedForGatewayRequest,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(
            getExpected({ allowed: false, reason: GatewayDecisionResponseReason.TooManyRequests, pricingPK: null })
        );
    });

    test("Should increment request count on each request", async () => {
        await getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: queryCheckUserIsAllowedForGatewayRequest,
            variables: getVariables(),
        });
        let counter = context.batched.GatewayRequestCounter.get({
            requester: UserPK.stringify(testSubscriber),
        });
        await expect(counter).resolves.toMatchObject({
            counter: 1,
        });
        await getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: queryCheckUserIsAllowedForGatewayRequest,
            variables: getVariables(),
        });
        context.batched.GatewayRequestCounter.clearCache();
        counter = context.batched.GatewayRequestCounter.get({
            requester: UserPK.stringify(testSubscriber),
        });
        await expect(counter).resolves.toMatchObject({
            counter: 2,
        });
    });

    test("Should call incrementOrCreateRequestCounter", async () => {
        const incrementOrCreateRequestCounter = onIncrementOrCreateRequestCounterSpy();
        await getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: queryCheckUserIsAllowedForGatewayRequest,
            variables: getVariables(),
        });
        expect(incrementOrCreateRequestCounter).toHaveBeenCalledTimes(1);
        await expect(incrementOrCreateRequestCounter.mock.results[0].value).resolves.toMatchObject({
            counter: 1,
            counterSinceLastReset: 1,
            isGlobalCounter: true,
            lastResetTime: expect.any(Number) as number,
            requester: UserPK.stringify(testSubscriber),
        });
    });

    test("Should return {allowed: true} if internal checkUserIsAllowedForGatewayRequest returns true", async () => {
        const balanceCheckCanBeMadeAfterRequest = balanceCheckCanBeMadeAfterRequestSpy();
        const checkUserIsAllowedForGatewayRequest = checkUserIsAllowedForGatewayRequestSpy();
        const cacheGatewayDecisionForRequest = cacheGatewayDecisionForRequestSpy();
        balanceCheckCanBeMadeAfterRequest.mockImplementation(() => false);
        const mockcheckUserIsAllowedForGatewayRequestResponse: GatewayDecisionResponse = {
            allowed: true,
            reason: null,
            pricingPK: PricingPK.stringify(testPricing),
            userPK: UserPK.stringify(testSubscriber),
        };
        checkUserIsAllowedForGatewayRequest.mockImplementation(() =>
            Promise.resolve(mockcheckUserIsAllowedForGatewayRequestResponse)
        );
        cacheGatewayDecisionForRequest.mockImplementation(() => createTestGatewayRequestDecisionCache(context));
        const response = await getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: queryCheckUserIsAllowedForGatewayRequest,
            variables: getVariables(),
        });
        expect(balanceCheckCanBeMadeAfterRequest).toHaveBeenCalledOnce();
        expect(checkUserIsAllowedForGatewayRequest).toHaveBeenCalledExactlyOnceWith(
            expect.anything(),
            expect.objectContaining({
                requester: UserPK.stringify(testSubscriber),
                pricing: PricingPK.stringify(testPricing),
                app: AppPK.stringify(testApp),
            })
        );
        expect(cacheGatewayDecisionForRequest).toHaveBeenCalledExactlyOnceWith(
            expect.anything(),
            expect.objectContaining({
                response: mockcheckUserIsAllowedForGatewayRequestResponse,
                app: AppPK.stringify(testApp),
                requester: UserPK.stringify(testSubscriber),
                pricing: PricingPK.stringify(testPricing),
                gatewayDecisionCache: null,
            })
        );
        expect(response).toMatchObject(
            getExpected({
                allowed: true,
                reason: null,
            })
        );
    });

    test("If balance check can be deferred, return {allowed: true}, but run checkUserIsAllowedForGatewayRequest and cacheGatewayDecisionForRequest later", async () => {
        const balanceCheckCanBeMadeAfterRequest = balanceCheckCanBeMadeAfterRequestSpy();
        const checkUserIsAllowedForGatewayRequest = checkUserIsAllowedForGatewayRequestSpy();
        const cacheGatewayDecisionForRequest = cacheGatewayDecisionForRequestSpy();
        balanceCheckCanBeMadeAfterRequest.mockImplementation(() => true);
        const mockcheckUserIsAllowedForGatewayRequestResponse: GatewayDecisionResponse = {
            allowed: true,
            reason: null,
            pricingPK: PricingPK.stringify(testPricing),
            userPK: UserPK.stringify(testSubscriber),
        };
        checkUserIsAllowedForGatewayRequest.mockImplementation(() =>
            Promise.resolve(mockcheckUserIsAllowedForGatewayRequestResponse)
        );
        cacheGatewayDecisionForRequest.mockImplementation(() => createTestGatewayRequestDecisionCache(context));
        const response = await getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: queryCheckUserIsAllowedForGatewayRequest,
            variables: getVariables(),
        });
        expect(balanceCheckCanBeMadeAfterRequest).toHaveBeenCalledOnce();
        expect(checkUserIsAllowedForGatewayRequest).toHaveBeenCalledExactlyOnceWith(
            expect.anything(),
            expect.objectContaining({
                requester: UserPK.stringify(testSubscriber),
                pricing: PricingPK.stringify(testPricing),
                app: AppPK.stringify(testApp),
            })
        );
        expect(cacheGatewayDecisionForRequest).toHaveBeenCalledExactlyOnceWith(
            expect.anything(),
            expect.objectContaining({
                response: mockcheckUserIsAllowedForGatewayRequestResponse,
                app: AppPK.stringify(testApp),
                requester: UserPK.stringify(testSubscriber),
                pricing: PricingPK.stringify(testPricing),
                gatewayDecisionCache: null,
            })
        );
        expect(response).toMatchObject(
            getExpected({
                allowed: true,
                reason: null,
            })
        );
    });
});
