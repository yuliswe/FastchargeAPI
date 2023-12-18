import { App, AppVisibility, GatewayMode } from "@/database/models/App";
import { Pricing, PricingAvailability } from "@/database/models/Pricing";
import { Subscription } from "@/database/models/Subscription";
import { User } from "@/database/models/User";
import { Can } from "@/permissions";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { SubscriptionPK } from "@/pks/SubscriptionPK";
import { UserPK } from "@/pks/UserPK";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import * as uuid from "uuid";

describe("deleteSubscription", () => {
  let testSubscription: Subscription;
  let testSubscriberUser: User;
  let testOtherUser: User;
  let testAppOwnerUser: User;
  let testPricing: Pricing;
  let testApp: App;

  beforeEach(async () => {
    testSubscriberUser = await getOrCreateTestUser(context);
    testOtherUser = await getOrCreateTestUser(context);
    testAppOwnerUser = await getOrCreateTestUser(context);
    testApp = await context.batched.App.create({
      name: `testapp-` + uuid.v4(),
      owner: UserPK.stringify(testAppOwnerUser),
      title: "Test App",
      description: "Test App Description",
      homepage: "https://fastchargeapi.com",
      repository: "https://github/myrepo",
      gatewayMode: GatewayMode.Proxy,
      visibility: AppVisibility.Public,
      readme: "readme",
    });
    testPricing = await context.batched.Pricing.create({
      name: "test-pricing" + uuid.v4(),
      app: AppPK.stringify(testApp),
      availability: PricingAvailability.Public,
      minMonthlyCharge: "0",
      chargePerRequest: "0",
      freeQuota: 0,
      callToAction: "test-call-to-action",
    });
    testSubscription = await context.batched.Subscription.create({
      pricing: PricingPK.stringify(testPricing),
      subscriber: UserPK.stringify(testSubscriberUser),
      app: AppPK.stringify(testApp),
    });
  });

  const deleteSubscriptionMutation = graphql(`
    mutation TestDeleteSubscriptionMutation($pk: ID!) {
      getSubscription(pk: $pk) {
        deleteSubscription {
          pk
        }
      }
    }
  `);

  function getVariables() {
    return {
      pk: SubscriptionPK.stringify(testSubscription),
    };
  }

  function getExpectedSubscription() {
    return {
      data: {
        getSubscription: {
          deleteSubscription: {
            __typename: "Subscribe",
            pk: SubscriptionPK.stringify(testSubscription),
          },
        },
      },
    };
  }

  test("Owner can delete subscription", async () => {
    const promise = getTestGQLClient({ user: testSubscriberUser }).mutate({
      mutation: deleteSubscriptionMutation,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpectedSubscription());
  });

  test("Other user cannot delete subscription", async () => {
    jest.spyOn(Can, "getSubscription").mockImplementation(() => Promise.resolve(true));
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      mutation: deleteSubscriptionMutation,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getSubscription.deleteSubscription",
      },
    ]);
  });
});
