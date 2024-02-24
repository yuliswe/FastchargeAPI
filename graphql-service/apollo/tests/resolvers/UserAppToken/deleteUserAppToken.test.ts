import { RequestContext, createDefaultContextBatched } from "@/src/RequestContext";
import { PricingAvailability } from "@/src/__generated__/gql/graphql";
import { App } from "@/src/database/models/App";
import { Pricing } from "@/src/database/models/Pricing";
import { User } from "@/src/database/models/User";
import { UserAppToken } from "@/src/database/models/UserAppToken";
import { createUserAppToken } from "@/src/functions/token";
import { Can } from "@/src/permissions";
import { AppPK } from "@/src/pks/AppPK";
import { PricingPK } from "@/src/pks/PricingPK";
import { UserAppTokenPK } from "@/src/pks/UserAppToken";
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

const deleteUserAppTokenMutation = graphql(`
  query Test_DeleteUserAppToken($pk: ID!) {
    getUserAppToken(pk: $pk) {
      deleteUserAppToken {
        pk
        createdAt
        updatedAt
        signature
      }
    }
  }
`);

describe("createUserAppToken", () => {
  let testAppOwner: User;
  let testSubscriber: User;
  let testApp: App;
  let testPricing: Pricing;
  let testUserAppToken: UserAppToken;

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

  test("User can delete a token", async () => {
    const result = await getTestGQLClient({
      user: testSubscriber,
    }).mutate({
      mutation: deleteUserAppTokenMutation,
      variables: {
        pk: UserAppTokenPK.stringify(testUserAppToken),
      },
    });
    expect(result.data?.getUserAppToken.deleteUserAppToken).toMatchObject({
      __typename: "UserAppToken",
      pk: UserAppTokenPK.stringify(testUserAppToken),
      signature: testUserAppToken.signature,
      createdAt: testUserAppToken.createdAt,
      updatedAt: testUserAppToken.updatedAt,
    });
  });

  test("User can only delete their own token but not someone else's", async () => {
    jest.spyOn(Can, "getUserAppToken").mockImplementation(() => Promise.resolve(true));
    const result = getTestGQLClient({
      user: testAppOwner,
    }).mutate({
      mutation: deleteUserAppTokenMutation,
      variables: {
        pk: UserAppTokenPK.stringify(testUserAppToken),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getUserAppToken.deleteUserAppToken",
      },
    ]);
  });
});
