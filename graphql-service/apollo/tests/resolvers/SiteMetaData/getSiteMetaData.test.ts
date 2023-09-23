import { SiteMetaDataKey } from "@/__generated__/resolvers-types";
import { SiteMetaData } from "@/database/models/SiteMetaData";
import { User } from "@/database/models/User";
import { testGQLClient } from "@/tests/test-sql-client";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const getSiteMetaDataQuery = graphql(`
    query TestgetSiteMetaData($key: SiteMetaDataKey!) {
        getSiteMetaData(key: $key) {
            key
            value
            createdAt
            updatedAt
        }
    }
`);

describe("getSiteMetaData", () => {
    let testOtherUser: User;
    let testSiteMetaData: SiteMetaData;
    beforeEach(async () => {
        await context.batched.SiteMetaData.deleteIfExists({ key: SiteMetaDataKey.TestingKey });
        testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testSiteMetaData = await context.batched.SiteMetaData.getOrCreate({
            key: SiteMetaDataKey.TestingKey,
            value: "testvalue" + uuid.v4(),
        });
    });

    test("Anyone can get site meta data", async () => {
        const promise = testGQLClient({ user: testOtherUser }).query({
            query: getSiteMetaDataQuery,
            variables: { key: SiteMetaDataKey.TestingKey },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getSiteMetaData: {
                    __typename: "SiteMetaData",
                    key: "_testingKey",
                    value: testSiteMetaData.value,
                    updatedAt: expect.any(Number),
                    createdAt: expect.any(Number),
                },
            },
        });
    });
});
