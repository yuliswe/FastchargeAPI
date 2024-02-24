import { graphql } from "@/src/__generated__/gql";
import { PricingAvailability } from "@/src/__generated__/gql/graphql";
import { App } from "@/src/database/models/App";
import { Pricing } from "@/src/database/models/Pricing";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { UserPK } from "@/src/pks/UserPK";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { v4 as uuidv4 } from "uuid";

describe("deletePricing", () => {
  let testAppOwner: User;
  let testOtherUser: User;
  let testApp: App;
  let testPricing: Pricing;

  beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAppOwnerEmail = `testuser_appowner_${uuidv4()}@gmail_mock.com`;
    const testOtherUserEmail = `testuser_otheruser_${uuidv4()}@gmail_mock.com`;
    testAppOwner = await getOrCreateTestUser(context, { email: testAppOwnerEmail });
    testOtherUser = await getOrCreateTestUser(context, { email: testOtherUserEmail });
    testApp = await context.batched.App.createOverwrite({
      name: testAppName,
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

  const deletePricingMutation = graphql(`
    query DeletePricingByPK($pk: ID!) {
      getPricing(pk: $pk) {
        deletePricing {
          pk
          name
          availability
          minMonthlyCharge
          chargePerRequest
          freeQuota
          callToAction
          freeQuota
          updatedAt
          createdAt
          app {
            pk
          }
        }
      }
    }
  `);

  test("App owner can delete pricing", async () => {
    const result = await getTestGQLClient({ user: testAppOwner }).mutate({
      mutation: deletePricingMutation,
      variables: {
        pk: PricingPK.stringify(testPricing),
      },
    });
    expect(result.data?.getPricing.deletePricing).toEqual({
      __typename: "Pricing",
      pk: PricingPK.stringify(testPricing),
      name: "test-pricing",
      app: { __typename: "App", pk: AppPK.stringify(testApp) },
      availability: PricingAvailability.Public,
      minMonthlyCharge: "0",
      chargePerRequest: "0",
      freeQuota: 0,
      callToAction: "test-call-to-action",
      createdAt: testPricing.createdAt,
      updatedAt: testPricing.updatedAt,
    });
  });

  test("Other owners cannot delete pricing they don't own.", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      context,
      mutation: deletePricingMutation,
      variables: {
        pk: PricingPK.stringify(testPricing),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
      },
    ]);
  });
});
