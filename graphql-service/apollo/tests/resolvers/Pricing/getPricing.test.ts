import { PricingAvailability, TestGetPricingByPkQuery } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { Pricing } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
    sortGraphQLErrors,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

describe("getPricing", () => {
    let testAppOwner: User;
    let testOtherUser: User;
    let testApp: App;
    let testPricing: Pricing;

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context);
        testOtherUser = await getOrCreateTestUser(context);
        testApp = await context.batched.App.createOverwrite({
            name: `testapp-${uuidv4()}`,
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
    });

    const getPricingByPKQuery = graphql(`
        query TestGetPricingByPK($pk: ID!) {
            getPricing(pk: $pk) {
                pk
                name
                availability
                minMonthlyCharge
                chargePerRequest
                freeQuota
                callToAction
            }
        }
    `);

    function getVariables() {
        return {
            pk: PricingPK.stringify(testPricing),
        };
    }

    function getExpected({ overwrite }: { overwrite?: Partial<TestGetPricingByPkQuery["getPricing"]> } = {}) {
        return {
            data: {
                getPricing: {
                    __typename: "Pricing",
                    availability: "public",
                    callToAction: "test-call-to-action",
                    chargePerRequest: "0",
                    freeQuota: 0,
                    minMonthlyCharge: "0",
                    name: "test-pricing",
                    pk: expect.any(String),
                    ...overwrite,
                },
            },
        };
    }

    test("App owner can read pricing", async () => {
        const promise = getTestGQLClient({ user: testAppOwner }).query({
            query: getPricingByPKQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(getExpected());
    });

    test("App owner can read private pricing properties", async () => {
        await context.batched.Pricing.update(testPricing, {
            availability: PricingAvailability.ExistingSubscribers,
        });
        const promise = getTestGQLClient({ user: testAppOwner }).query({
            query: getPricingByPKQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(
            getExpected({
                overwrite: {
                    availability: PricingAvailability.ExistingSubscribers,
                },
            })
        );
    });

    test("User can read public pricing properties.", async () => {
        const promise = getTestGQLClient({ user: testOtherUser }).query({
            query: getPricingByPKQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(getExpected());
    });

    test("Other user can read pricing they don't own if the pricing is private.", async () => {
        await context.batched.Pricing.update(testPricing, {
            availability: PricingAvailability.ExistingSubscribers,
        });
        const promise = getTestGQLClient({ user: testOtherUser }).query({
            query: getPricingByPKQuery,
            variables: getVariables(),
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject(
            sortGraphQLErrors(
                ["pk", "name", "availability", "minMonthlyCharge", "chargePerRequest", "freeQuota", "callToAction"].map(
                    (f) => ({
                        code: "PERMISSION_DENIED",
                        path: `getPricing.${f}`,
                    })
                )
            )
        );
    });
});
