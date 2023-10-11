import { App, AppVisibility, GatewayMode } from "@/database/models/App";
import { Pricing, PricingAvailability } from "@/database/models/Pricing";
import { Subscription } from "@/database/models/Subscription";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { SubscriptionPK } from "@/pks/SubscriptionPK";
import { UserPK } from "@/pks/UserPK";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { testGQLClient } from "@/tests/testGQLClient";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe } from "@jest/globals";
import * as uuid from "uuid";

describe("createSubscription", () => {
    let testApp: App;
    let testPricing: Pricing;
    let testNewPricing: Pricing;
    let testSubscriber: User;
    let testAppOwner: User;
    let testSubscription: Subscription;

    beforeEach(async () => {
        testSubscriber = await getOrCreateTestUser(context);
        testAppOwner = await getOrCreateTestUser(context);
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
        testNewPricing = await context.batched.Pricing.create({
            name: `testpricing-${uuid.v4()}`,
            app: AppPK.stringify(testApp),
            availability: PricingAvailability.Public,
            minMonthlyCharge: "0",
            chargePerRequest: "0",
            freeQuota: 0,
            callToAction: "test",
        });
        testSubscription = await context.batched.Subscription.create({
            pricing: PricingPK.stringify(testPricing),
            subscriber: UserPK.stringify(testSubscriber),
            app: AppPK.stringify(testApp),
        });
    });

    const updateSubscriptionMutation = graphql(`
        mutation TestUpdateSubscription($pk: ID!, $pricing: ID!) {
            getSubscription(pk: $pk) {
                updateSubscription(pricing: $pricing) {
                    pk
                    pricing {
                        pk
                    }
                }
            }
        }
    `);

    function getVariables() {
        return {
            pk: SubscriptionPK.stringify(testSubscription),
            pricing: PricingPK.stringify(testNewPricing),
        };
    }

    test("Subscriber can update their subscription", async () => {
        const promise = testGQLClient({ user: testSubscriber }).mutate({
            mutation: updateSubscriptionMutation,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getSubscription: {
                    __typename: "Subscribe",
                    updateSubscription: {
                        __typename: "Subscribe",
                        pk: SubscriptionPK.stringify(testSubscription),
                        pricing: {
                            __typename: "Pricing",
                            pk: PricingPK.stringify(testNewPricing),
                        },
                    },
                },
            },
        });
    });

    test("User cannot update someone else's subscription", async () => {
        const promise = testGQLClient({ user: testAppOwner }).mutate({
            mutation: updateSubscriptionMutation,
            variables: getVariables(),
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getSubscription.updateSubscription",
            },
        ]);
    });
});
