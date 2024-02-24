import { PricingAvailability } from "@/src/__generated__/gql/graphql";
import { App } from "@/src/database/models/App";
import { Pricing } from "@/src/database/models/Pricing";
import { User } from "@/src/database/models/User";
import { UserAppToken } from "@/src/database/models/UserAppToken";
import { createUserAppToken } from "@/src/functions/token";
import { AppPK } from "@/src/pks/AppPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { UserAppTokenPK } from "@/src/pks/UserAppToken";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

describe("getUserAppToken", () => {
  let testAppOwner: User;
  let testSubscriber: User;
  let testApp: App;
  let testPricing: Pricing;
  let testUserAppToken: UserAppToken;

  beforeEach(async () => {
    testAppOwner = await getOrCreateTestUser(context);
    testSubscriber = await getOrCreateTestUser(context);
    testApp = await context.batched.App.create({
      name: `test-${uuid.v4()}`,
      owner: UserPK.stringify(testAppOwner),
    });
    testPricing = await context.batched.Pricing.create({
      app: AppPK.stringify(testApp),
      name: "test-pricing",
      availability: PricingAvailability.Public,
    });
    await context.batched.Subscription.create({
      app: AppPK.stringify(testApp),
      subscriber: UserPK.stringify(testSubscriber),
      pricing: PricingPK.stringify(testPricing),
    });
    testUserAppToken = (
      await createUserAppToken(context, {
        user: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      })
    ).userAppToken;
  });

  const getUserAppTokenQuery = graphql(`
    query Test_GetUserAppToken($pk: ID!) {
      getUserAppToken(pk: $pk) {
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

  function getVariables() {
    return {
      pk: UserAppTokenPK.stringify(testUserAppToken),
    };
  }

  function getExpected() {
    return {
      data: {
        getUserAppToken: {
          __typename: "UserAppToken",
          pk: UserAppTokenPK.stringify(testUserAppToken),
          signature: testUserAppToken.signature,
          createdAt: testUserAppToken.createdAt,
          updatedAt: testUserAppToken.updatedAt,
          subscriber: {
            __typename: "User",
            pk: UserPK.stringify(testSubscriber),
          },
          app: {
            __typename: "App",
            pk: AppPK.stringify(testApp),
          },
        },
      },
    };
  }

  test("Subscriber can get their own token.", async () => {
    const promise = getTestGQLClient({
      user: testSubscriber,
    }).query({
      query: getUserAppTokenQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpected());
  });

  test("Subscriber cannot query another user's token.", async () => {
    const result = getTestGQLClient({
      user: testAppOwner,
    }).query({
      query: getUserAppTokenQuery,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getUserAppToken",
      },
    ]);
  });

  test("token must be null becuase it can only be viewed once when created.", async () => {
    const promise = getTestGQLClient({
      user: testSubscriber,
    }).query({
      query: getUserAppTokenQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getUserAppToken: {
          __typename: "UserAppToken",
          token: null,
        },
      },
    });
  });
});
