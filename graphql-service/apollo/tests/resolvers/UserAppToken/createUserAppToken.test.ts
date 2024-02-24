import { RequestContext, createDefaultContextBatched } from "@/src/RequestContext";
import { PricingAvailability } from "@/src/__generated__/gql/graphql";
import { App } from "@/src/database/models/App";
import { Pricing } from "@/src/database/models/Pricing";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

const context: RequestContext = {
  batched: createDefaultContextBatched(),
  isServiceRequest: false,
  isSQSMessage: false,
  isAnonymousUser: false,
  isAdminUser: false,
};

const createUserAppTokenMutation = graphql(`
  mutation Test_CreateUserAppToken($subscriber: ID!, $app: ID!) {
    createUserAppToken(subscriber: $subscriber, app: $app) {
      pk
      createdAt
      updatedAt
      signature
      app {
        pk
      }
      subscriber {
        pk
      }
      token
    }
  }
`);

describe("createUserAppToken", () => {
  let testAppOwner: User;
  let testSubscriber: User;
  let testApp: App;
  let testPricing: Pricing;

  beforeEach(async () => {
    testAppOwner = await getOrCreateTestUser(context, { email: `testuser_${uuid.v4()}@gmail_mock.com` });
    testSubscriber = await getOrCreateTestUser(context, { email: `testuser_${uuid.v4()}@gmail_mock.com` });
    testApp = await context.batched.App.create({
      name: `test-${uuid.v4()}`,
      owner: UserPK.stringify(testAppOwner),
    });
    testPricing = await context.batched.Pricing.create({
      app: AppPK.stringify(testApp),
      name: "test-pricing",
      availability: PricingAvailability.Public,
    });
  });

  test("Subscriber can create a token", async () => {
    await context.batched.Subscription.create({
      app: AppPK.stringify(testApp),
      subscriber: UserPK.stringify(testSubscriber),
      pricing: PricingPK.stringify(testPricing),
    });

    const result = await getTestGQLClient({
      user: testSubscriber,
    }).mutate({
      mutation: createUserAppTokenMutation,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    expect(result).toMatchObject({
      data: {
        createUserAppToken: {
          __typename: "UserAppToken",
          pk: expect.any(String),
          signature: expect.any(String),
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
          app: {
            __typename: "App",
            pk: AppPK.stringify(testApp),
          },
          subscriber: {
            __typename: "User",
            pk: UserPK.stringify(testSubscriber),
          },
        },
      },
    });
  });

  test("When creating a token, the token value is returned.", async () => {
    await context.batched.Subscription.create({
      app: AppPK.stringify(testApp),
      subscriber: UserPK.stringify(testSubscriber),
      pricing: PricingPK.stringify(testPricing),
    });

    const result = await getTestGQLClient({
      user: testSubscriber,
    }).mutate({
      mutation: createUserAppTokenMutation,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    expect(result).toMatchObject({
      data: {
        createUserAppToken: {
          __typename: "UserAppToken",
          token: expect.any(String),
        },
      },
    });
  });

  test("Subscriber cannot create a token for an app they are not subscribed to", async () => {
    const result = getTestGQLClient({
      user: testSubscriber,
    }).mutate({
      mutation: createUserAppTokenMutation,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
      {
        code: "REQUIREMENT_NOT_SATISFIED",
        message: "You must be subscribed to this app to create a token.",
        path: "createUserAppToken",
      },
    ]);
  });

  test("A user cannot create a token for another user", async () => {
    await context.batched.Subscription.create({
      app: AppPK.stringify(testApp),
      subscriber: UserPK.stringify(testSubscriber),
      pricing: PricingPK.stringify(testPricing),
    });

    const result = getTestGQLClient({
      user: testAppOwner,
    }).mutate({
      mutation: createUserAppTokenMutation,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "createUserAppToken",
      },
    ]);
  });

  test("A user can only create one token per app", async () => {
    await context.batched.Subscription.create({
      app: AppPK.stringify(testApp),
      subscriber: UserPK.stringify(testSubscriber),
      pricing: PricingPK.stringify(testPricing),
    });

    await getTestGQLClient({
      user: testSubscriber,
    }).mutate({
      mutation: createUserAppTokenMutation,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });

    const result = getTestGQLClient({
      user: testSubscriber,
    }).mutate({
      mutation: createUserAppTokenMutation,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
      {
        code: "TOO_MANY_RESOURCES",
        message: "A token already exists for this user and app.",
        path: "createUserAppToken",
      },
    ]);
  });
});
