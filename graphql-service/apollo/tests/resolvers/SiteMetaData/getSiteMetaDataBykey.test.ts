import { SiteMetaDataKey } from "@/__generated__/gql/graphql";
import { SiteMetaData } from "@/database/models/SiteMetaData";
import { User } from "@/database/models/User";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const getSiteMetaDataQuery = graphql(`
  query TestgetSiteMetaData($key: String!) {
    getSiteMetaDataByKey(key: $key) {
      key
      value
      createdAt
      updatedAt
    }
  }
`);

describe("getSiteMetaDataByKeyByKey", () => {
  let testOtherUser: User;
  let testSiteMetaData: SiteMetaData;
  beforeEach(async () => {
    testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
    testSiteMetaData = await context.batched.SiteMetaData.createOverwrite({
      key: ("testkey-" + uuid.v4()) as SiteMetaDataKey,
      value: "testvalue" + uuid.v4(),
    });
  });

  test("Anyone can get site meta data", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).query({
      query: getSiteMetaDataQuery,
      variables: { key: testSiteMetaData.key },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getSiteMetaDataByKey: {
          __typename: "SiteMetaData",
          key: testSiteMetaData.key,
          value: testSiteMetaData.value,
          updatedAt: expect.any(Number),
          createdAt: expect.any(Number),
        },
      },
    });
  });
});
