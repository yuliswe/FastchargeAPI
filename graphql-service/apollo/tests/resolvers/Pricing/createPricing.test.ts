import { graphql } from "@/__generated__/gql";
import { PricingAvailability } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { getTestGQLClient } from "@/tests/testGQLClients";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

describe("createPricing", () => {
    let testAppOwner: User;
    let testOtherUser: User;
    let testApp: App;

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context);
        testOtherUser = await getOrCreateTestUser(context);
        testApp = await context.batched.App.create({
            name: `testapp-${uuidv4()}`,
            owner: UserPK.stringify(testAppOwner),
        });
    });

    const createPricingMutation = graphql(`
        mutation TestCreatePricing(
            $name: String!
            $app: ID!
            $availability: PricingAvailability!
            $minMonthlyCharge: NonNegativeDecimal!
            $chargePerRequest: NonNegativeDecimal!
            $freeQuota: Int!
            $callToAction: String
        ) {
            createPricing(
                name: $name
                app: $app
                availability: $availability
                minMonthlyCharge: $minMonthlyCharge
                chargePerRequest: $chargePerRequest
                freeQuota: $freeQuota
                callToAction: $callToAction
            ) {
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

    test("App owner can create pricing", async () => {
        const result = await getTestGQLClient({ user: testAppOwner }).mutate({
            mutation: createPricingMutation,
            variables: {
                name: "Premium",
                app: AppPK.stringify(testApp),
                availability: PricingAvailability.Public,
                minMonthlyCharge: "0",
                chargePerRequest: "0",
                freeQuota: 100,
                callToAction: "Subscribe now!",
            },
        });
        expect(result.data?.createPricing.pk).not.toBe(null);
    });

    test("Other user can't create pricing for app they don't own.", async () => {
        const promise = getTestGQLClient({ user: testOtherUser }).mutate({
            mutation: createPricingMutation,
            variables: {
                name: "Premium",
                app: AppPK.stringify(testApp),
                availability: PricingAvailability.Public,
                minMonthlyCharge: "0",
                chargePerRequest: "0",
                freeQuota: 100,
                callToAction: "Subscribe now!",
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
            },
        ]);
    });

    test("Create too many pricing", async () => {
        const promise = async (): Promise<void> => {
            for (let i = 0; i <= 201; i++) {
                await getTestGQLClient({ user: testAppOwner }).mutate({
                    mutation: createPricingMutation,
                    variables: {
                        name: "Premium",
                        app: AppPK.stringify(testApp),
                        availability: PricingAvailability.Public,
                        minMonthlyCharge: "0",
                        chargePerRequest: "0",
                        freeQuota: 100,
                        callToAction: "Subscribe now!",
                    },
                });
            }
        };
        await expect(simplifyGraphQLPromiseRejection(promise())).rejects.toMatchObject([
            {
                code: "TOO_MANY_RESOURCES",
            },
        ]);
    });
});
