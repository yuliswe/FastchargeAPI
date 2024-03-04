import { SiteMetaDataKey } from "@/src/__generated__/resolvers-types";
import { SiteMetaData } from "@/src/database/models/SiteMetaData";
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

describe("deleteSiteMetaData", () => {
  let testOtherUser: User;
  let testSiteMetaData: SiteMetaData;

  const deleteSiteMetaDataMutation = graphql(`
    mutation TestdeleteSiteMetaData($key: String!) {
      getSiteMetaDataByKey(key: $key) {
        deleteSiteMetaData {
          key
          value
        }
      }
    }
  `);

  beforeEach(async () => {
    testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
    testSiteMetaData = await context.batched.SiteMetaData.createOverwrite({
      key: ("testkey-" + uuid.v4()) as SiteMetaDataKey,
      value: "testvalue" + uuid.v4(),
    });
  });

  test("Admin can update site meta data", async () => {
    const promise = getTestGQLClient({ user: await createTestUser(context, { isAdmin: true }) }).mutate({
      mutation: deleteSiteMetaDataMutation,
      variables: { key: testSiteMetaData.key },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getSiteMetaDataByKey: {
          deleteSiteMetaData: {
            __typename: "SiteMetaData",
            key: testSiteMetaData.key,
            value: testSiteMetaData.value,
          },
        },
      },
    });
  });

  test("Other users cannot update site meta data", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      mutation: deleteSiteMetaDataMutation,
      variables: { key: testSiteMetaData.key },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getSiteMetaDataByKey.deleteSiteMetaData",
      },
    ]);
  });
});
