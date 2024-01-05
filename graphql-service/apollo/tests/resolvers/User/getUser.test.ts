import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { Can } from "@/permissions";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { createTestApp } from "@/tests/test-data/App";
import { createTestUser } from "@/tests/test-data/User";
import { getGraphQLDataOrError } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";

const context: RequestContext = {
  batched: createDefaultContextBatched(),
  isServiceRequest: false,
  isSQSMessage: false,
  isAnonymousUser: false,
  isAdminUser: false,
};

let testUser: User;
let testPublicUser: User;
let testApp: App;

beforeAll(async () => {
  testUser = await createTestUser(context);
  testPublicUser = await createTestUser(context);
  testApp = await createTestApp(context, {
    owner: UserPK.stringify(testUser),
  });
});

const getUserByPK = graphql(`
  query GetUserByPK($pk: ID!) {
    getUser(pk: $pk) {
      ...TestUserPublicFields
      ...TestUserPrivateFields
    }
  }

  fragment TestUserPublicFields on User {
    author
    apps {
      pk
    }
  }

  fragment TestUserPrivateFields on User {
    pk
    email
    subscriptions {
      pk
    }
    createdAt
    updatedAt
    balance
    balanceLimit
    stripeCustomerId
    stripeConnectAccountId
  }
`);

const getUserByPkOnlyPublicFields = graphql(`
  query getUserByPkOnlyPublicFields($pk: ID!) {
    getUser(pk: $pk) {
      ...TestUserPublicFields
    }
  }
`);

describe("getUser", () => {
  test("A user can get itself", async () => {
    const result = await getTestGQLClient({ user: testUser }).query({
      query: getUserByPK,
      variables: {
        pk: UserPK.stringify(testUser),
      },
    });
    expect(result.data?.getUser).toMatchObject({
      __typename: "User",
      pk: expect.stringContaining("user_"),
    });
  });

  test("A user cannot be queried by another user", async () => {
    const promise = getTestGQLClient({ user: testPublicUser }).query({
      query: getUserByPK,
      variables: {
        pk: UserPK.stringify(testUser),
      },
    });
    await expect(getGraphQLDataOrError(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getUser",
      },
    ]);
  });

  test("User fields that are hidden from public", async () => {
    jest.spyOn(Can, "getUser").mockImplementation(() => Promise.resolve(true));
    const promise = getTestGQLClient({ user: testPublicUser }).query({
      query: getUserByPK,
      variables: {
        pk: UserPK.stringify(testUser),
      },
    });

    await expect(getGraphQLDataOrError(promise)).rejects.toMatchSnapshot();
  });

  test("User fields that are visible to public", async () => {
    jest.spyOn(Can, "getUser").mockImplementation(() => Promise.resolve(true));
    const result = getTestGQLClient({ user: testPublicUser }).query({
      query: getUserByPkOnlyPublicFields,
      variables: {
        pk: UserPK.stringify(testUser),
      },
    });
    await expect(getGraphQLDataOrError(result)).resolves.toMatchSnapshotExceptForProps({
      getUser: {
        author: testUser.author,
        apps: [
          {
            pk: AppPK.stringify(testApp),
          },
        ],
      },
    });
  });
});
