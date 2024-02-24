import { RequestContext, createDefaultContextBatched } from "@/src/RequestContext";
import { Currency, StripePaymentAcceptStatus } from "@/src/__generated__/gql/graphql";
import { App } from "@/src/database/models/App";
import { User } from "@/src/database/models/User";
import { Can } from "@/src/permissions";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { getGraphQLDataOrError, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
  batched: createDefaultContextBatched(),
  isServiceRequest: false,
  isSQSMessage: false,
  isAnonymousUser: false,
  isAdminUser: false,
};

let testMainUser: User;
let testOtherUser: User;
let testApp: App;
beforeAll(async () => {
  testMainUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
  testOtherUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
  testApp = await context.batched.App.create({
    name: `testapp-${uuidv4()}`,
    owner: UserPK.stringify(testMainUser),
  });
  await context.batched.UserAppToken.create({
    app: AppPK.stringify(testApp),
    createdAt: Date.now(),
    subscriber: UserPK.stringify(testMainUser),
    signature: uuidv4(),
  });
  await context.batched.StripePaymentAccept.create({
    amount: "100",
    currency: Currency.Usd,
    stripePaymentStatus: StripePaymentAcceptStatus.Pending,
    stripePaymentIntent: uuidv4(),
    stripeSessionId: uuidv4(),
    stripeSessionObject: {},
    user: UserPK.stringify(testMainUser),
  });
});

describe("udpate User", () => {
  test("User can update author name", async () => {
    const result = await getTestGQLClient({ user: testMainUser }).mutate({
      mutation: graphql(`
        query UpdateUserAuthorName($user: ID!, $newAuthorName: String!) {
          getUser(pk: $user) {
            updateUser(author: $newAuthorName) {
              pk
              author
            }
          }
        }
      `),
      variables: {
        user: UserPK.stringify(testMainUser),
        newAuthorName: "new name",
      },
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.getUser.updateUser).toMatchObject({
      pk: UserPK.stringify(testMainUser),
      author: "new name",
    });
  });

  test("User can only update their own name", async () => {
    jest.spyOn(Can, "getUser").mockImplementationOnce((user, context) => Promise.resolve(true));
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      mutation: graphql(`
        query UpdateUserAuthorName($user: ID!, $newAuthorName: String!) {
          getUser(pk: $user) {
            updateUser(author: $newAuthorName) {
              pk
              author
            }
          }
        }
      `),
      variables: {
        user: UserPK.stringify(testMainUser),
        newAuthorName: "new name",
      },
    });
    await expect(getGraphQLDataOrError(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        path: "getUser.updateUser",
      },
    ]);
  });

  describe("Only service can update these fields:", () => {
    for (const field of ["stripeCustomerId", "stripeConnectAccountId"]) {
      test(`${field}`, async () => {
        const promise = getTestGQLClient({ user: testMainUser }).query({
          query: graphql(`
            query UpdateUser_ServiceOnly($user: ID!, $stripeCustomerId: String, $stripeConnectAccountId: String) {
              getUser(pk: $user) {
                updateUser(stripeCustomerId: $stripeCustomerId, stripeConnectAccountId: $stripeConnectAccountId) {
                  pk
                  stripeCustomerId
                  stripeConnectAccountId
                }
              }
            }
          `),
          variables: {
            user: UserPK.stringify(testMainUser),
            [field]: "new value",
          },
        });
        await expect(getGraphQLDataOrError(promise)).rejects.toMatchObject([
          {
            code: "PERMISSION_DENIED",
            path: `getUser.updateUser`,
            message: "You do not have permission to perform this action.",
          },
        ]);
      });
    }
  });
});
