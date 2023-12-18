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
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import * as uuid from "uuid";

describe("getSubscription", () => {
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

  const getSubscriptionQuery = graphql(`
    query TestGetSubscriptionQuery($pk: ID!) {
      getSubscription(pk: $pk) {
        pk
        pricing {
          pk
        }
        subscriber {
          pk
        }
        app {
          pk
        }
        createdAt
        updatedAt
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
          __typename: "Subscribe",
          app: {
            __typename: "App",
            pk: AppPK.stringify(testApp),
          },
          pk: SubscriptionPK.stringify(testSubscription),
          pricing: {
            __typename: "Pricing",
            pk: PricingPK.stringify(testPricing),
          },
          subscriber: {
            __typename: "User",
            pk: UserPK.stringify(testSubscriberUser),
          },
          createdAt: testSubscription.createdAt,
          updatedAt: testSubscription.updatedAt,
        },
      },
    };
  }

  test("Owner can get subscription", async () => {
    const promise = getTestGQLClient({ user: testSubscriberUser }).query({
      query: getSubscriptionQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpectedSubscription());
  });

  test("Other user cannot get subscription", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).query({
      query: getSubscriptionQuery,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getSubscription",
      },
    ]);
  });

  test("App owner can get subscription", async () => {
    const promise = getTestGQLClient({ user: testAppOwnerUser }).query({
      query: graphql(`
        query TestSubscriberGetSubscriptionQuery($pk: ID!) {
          getSubscription(pk: $pk) {
            pk
            pricing {
              pk
            }
            subscriber {
              author
            }
            app {
              pk
            }
            createdAt
            updatedAt
          }
        }
      `),
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getSubscription: {
          ...getExpectedSubscription().data.getSubscription,
          subscriber: {
            __typename: "User",
            author: testSubscriberUser.author,
          },
        },
      },
    });
  });
});
