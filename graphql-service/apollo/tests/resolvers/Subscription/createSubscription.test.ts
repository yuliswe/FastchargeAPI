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

describe("createSubscription", () => {
  let testApp: App;
  let testPricing: Pricing;
  let testSubscriber: User;
  let testAppOwner: User;

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
  });

  const createSubscriptionMutation = graphql(`
    mutation TestCreateSubscription($subscriber: ID!, $pricing: ID!) {
      createSubscription(pricing: $pricing, subscriber: $subscriber) {
        pk
      }
    }
  `);

  function getVariables() {
    return {
      pricing: PricingPK.stringify(testPricing),
      subscriber: UserPK.stringify(testSubscriber),
    };
  }

  test("A user can subscribe to a public app", async () => {
    const promise = getTestGQLClient({ user: testSubscriber }).mutate({
      mutation: createSubscriptionMutation,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        createSubscription: {
          __typename: "Subscribe",
          pk: expect.any(String),
        },
      },
    });
  });

  test("A user cannot subscribe to a private app", async () => {
    await context.batched.App.update(testApp, {
      visibility: AppVisibility.Private,
    });
    const promise = getTestGQLClient({ user: testSubscriber }).mutate({
      mutation: createSubscriptionMutation,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "This app is not available for purchase.",
        path: "createSubscription",
      },
    ]);
  });

  test("A user cannot subscribe to a private pricing plan", async () => {
    await context.batched.Pricing.update(testPricing, {
      availability: PricingAvailability.ExistingSubscribers,
    });
    const promise = getTestGQLClient({ user: testSubscriber }).mutate({
      mutation: createSubscriptionMutation,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "This pricing plan is not available for purchase.",
        path: "createSubscription",
      },
    ]);
  });

  test("A user cannot subscribe someone else to a pricing plan", async () => {
    const promise = getTestGQLClient({ user: testAppOwner }).mutate({
      mutation: createSubscriptionMutation,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "createSubscription",
      },
    ]);
  });
});
