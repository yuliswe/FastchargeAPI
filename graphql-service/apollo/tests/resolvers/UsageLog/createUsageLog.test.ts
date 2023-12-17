import { App, AppVisibility, GatewayMode } from "@/database/models/App";
import { Pricing, PricingAvailability } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("createUsageLog", () => {
    let testApp: App;
    let testAppOwner: User;
    let testUsageLogOwner: User;
    let testPricing: Pricing;

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context);
        testUsageLogOwner = await getOrCreateTestUser(context);
        testApp = await context.batched.App.create({
            name: `testapp-${uuid.v4()}`,
            owner: UserPK.stringify(testAppOwner),
            title: "Test App",
            description: "Test App Description",
            homepage: "https://fastchargeapi.com",
            repository: "https://github/myrepo",
            gatewayMode: GatewayMode.Proxy,
            visibility: AppVisibility.Public,
            readme: "readme",
        });
        testPricing = await context.batched.Pricing.create({
            name: `testpricing-${uuid.v4()}`,
            app: AppPK.stringify(testApp),
            availability: PricingAvailability.Public,
            minMonthlyCharge: "0",
            chargePerRequest: "0",
            freeQuota: 0,
            callToAction: "test",
        });
    });

    const createUsageLogMutation = graphql(`
        mutation TestCreateUsageLog($app: ID!, $path: String!, $subscriber: ID!, $volume: Int!, $pricing: ID!) {
            createUsageLog(app: $app, path: $path, subscriber: $subscriber, volume: $volume, pricing: $pricing) {
                pk
                app {
                    pk
                }
                path
                subscriber {
                    pk
                }
                volume
                pricing {
                    pk
                }
            }
        }
    `);

    function getVariables() {
        return {
            app: AppPK.stringify(testApp),
            path: "test-path",
            subscriber: UserPK.stringify(testUsageLogOwner),
            volume: 1,
            pricing: PricingPK.stringify(testPricing),
        };
    }

    function getExpected() {
        return {
            data: {
                createUsageLog: {
                    __typename: "UsageLog",
                    app: {
                        __typename: "App",
                        pk: AppPK.stringify(testApp),
                    },
                    path: "test-path",
                    pk: expect.any(String),
                    pricing: {
                        __typename: "Pricing",
                        pk: PricingPK.stringify(testPricing),
                    },
                    subscriber: {
                        __typename: "User",
                        pk: UserPK.stringify(testUsageLogOwner),
                    },
                    volume: 1,
                },
            },
        };
    }

    test("Service can create usage log", async () => {
        const promise = getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: createUsageLogMutation,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(getExpected());
    });

    test("Only service can create usage log", async () => {
        const promise = getTestGQLClient({ user: testAppOwner }).mutate({
            mutation: createUsageLogMutation,
            variables: getVariables(),
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "createUsageLog",
            },
        ]);
    });
});
