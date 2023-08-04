import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { RequestContext, createDefaultContextBatched } from "../../RequestContext";
import { graphql } from "../../__generated__/gql";
import { PricingAvailability } from "../../__generated__/gql/graphql";
import { App, User } from "../../dynamoose/models";
import { AppPK } from "../../pks/AppPK";
import { UserPK } from "../../pks/UserPK";
import { testGQLClient } from "../test-sql-client";
import { getOrCreateTestUser } from "../test-utils";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

let testAppOwner: User;
let testOtherUser: User;
let testApp: App;

beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAppOwnerEmail = `testuser_appowner_${uuidv4()}@gmail_mock.com`;
    const testOtherUserEmail = `testuser_otheruser_${uuidv4()}@gmail_mock.com`;
    testAppOwner = await getOrCreateTestUser(context, { email: testAppOwnerEmail });
    testOtherUser = await getOrCreateTestUser(context, { email: testOtherUserEmail });
    testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testAppOwner) });
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

describe("Test create pricing", () => {
    test("App owner can create pricing", async () => {
        const result = await testGQLClient({ user: testAppOwner }).mutate({
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
        await expect(
            testGQLClient({ user: testOtherUser }).mutate({
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
            })
        ).rejects.toMatchGraphQLError({
            code: "PERMISSION_DENIED",
        });
    });

    test("Create too many pricing", async () => {
        await expect(async (): Promise<void> => {
            for (let i = 0; i <= 201; i++) {
                await testGQLClient({ user: testAppOwner }).mutate({
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
        }).rejects.toMatchGraphQLError({
            code: "TOO_MANY_RESOURCES",
        });
    });
});
