import { graphql } from "@/__generated__/gql";
import { PricingAvailability } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { Pricing } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

describe("listPricingsByApp", () => {
    // jest.retryTimes(2);
    let testAppOwner: User;
    let testAppUser: User;
    let testApp: App;
    let testPricing: Pricing;

    const listPricingsByAppQuery = graphql(`
        query TestListPricingsByApp($app: ID!) {
            listPricingsByApp(app: $app) {
                pk
            }
        }
    `);

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context);
        testAppUser = await getOrCreateTestUser(context);
        testApp = await context.batched.App.create({
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

    function getVariables() {
        return {
            app: AppPK.stringify(testApp),
        };
    }

    function getExpected() {
        return {
            data: {
                listPricingsByApp: [
                    {
                        __typename: "Pricing",
                        pk: PricingPK.stringify(testPricing),
                    },
                ],
            },
        };
    }

    test("App owner can see pricing", async () => {
        const promise = getTestGQLClient({ user: testAppOwner }).query({
            query: listPricingsByAppQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(getExpected());
    });

    test("Any user can see public pricing", async () => {
        const promise = getTestGQLClient({ user: testAppUser }).query({
            query: listPricingsByAppQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(getExpected());
    });

    test("User cannot see pricing if the user is not subscribed to it", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: PricingAvailability.ExistingSubscribers,
        });
        const promise = getTestGQLClient({ user: testAppUser }).query({
            query: listPricingsByAppQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                listPricingsByApp: [],
            },
        });
    });

    test("App subscriber can see pricing", async () => {
        testPricing = await context.batched.Pricing.update(testPricing, {
            availability: PricingAvailability.ExistingSubscribers,
        });
        await context.batched.Subscription.create({
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
            subscriber: UserPK.stringify(testAppUser),
        });
        const promise = getTestGQLClient({ user: testAppUser }).query({
            query: listPricingsByAppQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(getExpected());
    });
});
