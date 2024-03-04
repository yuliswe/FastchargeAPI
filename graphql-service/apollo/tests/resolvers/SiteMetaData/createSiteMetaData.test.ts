import { SiteMetaDataKey } from "@/src/__generated__/resolvers-types";
import { User } from "@/src/database/models/User";
import { graphql } from "@/src/typed-graphql";
import { createTestUser } from "@/tests/test-data/User";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

const createSiteMetaDataMutation = graphql(`
  mutation TestCreateSiteMetaData($key: String!, $value: Any!) {
    createSiteMetaData(key: $key, value: $value) {
      key
      value
      createdAt
      updatedAt
    }
  }
`);

describe("createSiteMetaData", () => {
  let testOtherUser: User;
  beforeEach(async () => {
    testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
  });

  test("Admin can create site meta data", async () => {
    const variables = { key: ("testkey" + uuid.v4()) as SiteMetaDataKey, value: "testvalue" + uuid.v4() };
    const promise = getTestGQLClient({ user: await createTestUser(context, { isAdmin: true }) }).mutate({
      mutation: createSiteMetaDataMutation,
      variables,
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        createSiteMetaData: {
          ...variables,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        },
      },
    });
  });

  test("Other users cannot create site meta data", async () => {
    const variables = { key: ("testkey" + uuid.v4()) as SiteMetaDataKey, value: "testvalue" + uuid.v4() };
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      mutation: createSiteMetaDataMutation,
      variables,
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "createSiteMetaData",
      },
    ]);
  });
});
