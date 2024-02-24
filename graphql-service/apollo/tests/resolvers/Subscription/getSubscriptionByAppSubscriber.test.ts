import { App, AppVisibility, GatewayMode } from "@/src/database/models/App";
import { Pricing, PricingAvailability } from "@/src/database/models/Pricing";
import { Subscription } from "@/src/database/models/Subscription";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { SubscriptionPK } from "@/src/pks/SubscriptionPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

describe("getSubscriptionByAppSubscriber", () => {
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

  const getSubscriptionByAppSubscriberQuery = graphql(`
    query TestGetSubscriptionByAppSubscriberQuery($app: ID!, $subscriber: ID!) {
      getSubscriptionByAppSubscriber(app: $app, subscriber: $subscriber) {
        pk
      }
    }
  `);

  function getVariables() {
    return {
      app: AppPK.stringify(testApp),
      subscriber: UserPK.stringify(testSubscriberUser),
    };
  }

  function getExpectedSubscription() {
    return {
      data: {
        getSubscriptionByAppSubscriber: {
          __typename: "Subscribe",
          pk: SubscriptionPK.stringify(testSubscription),
        },
      },
    };
  }

  test("Owner can get subscription", async () => {
    const promise = getTestGQLClient({ user: testSubscriberUser }).query({
      query: getSubscriptionByAppSubscriberQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpectedSubscription());
  });

  test("Other user cannot get subscription", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).query({
      query: getSubscriptionByAppSubscriberQuery,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getSubscriptionByAppSubscriber",
      },
    ]);
  });

  test("App owner can get subscription", async () => {
    const promise = getTestGQLClient({ user: testAppOwnerUser }).query({
      query: getSubscriptionByAppSubscriberQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpectedSubscription());
  });
});
