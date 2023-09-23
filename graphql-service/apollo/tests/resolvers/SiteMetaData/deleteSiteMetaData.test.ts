import { SiteMetaDataKey } from "@/__generated__/resolvers-types";
import { SiteMetaData } from "@/database/models/SiteMetaData";
import { User } from "@/database/models/User";
import { testGQLClient } from "@/tests/test-sql-client";
import {
    baseRequestContext as context,
    getAdminUser,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("deleteSiteMetaData", () => {
    let testOtherUser: User;
    let testSiteMetaData: SiteMetaData;

    const deleteSiteMetaDataMutation = graphql(`
        mutation TestdeleteSiteMetaData($key: SiteMetaDataKey!) {
            getSiteMetaData(key: $key) {
                deleteSiteMetaData {
                    key
                    value
                }
            }
        }
    `);

    beforeEach(async () => {
        await context.batched.SiteMetaData.deleteIfExists({ key: SiteMetaDataKey.TestingKey });
        testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testSiteMetaData = await context.batched.SiteMetaData.getOrCreate({
            key: SiteMetaDataKey.TestingKey,
            value: "testvalue" + uuid.v4(),
        });
    });

    test("Admin can update site meta data", async () => {
        const promise = testGQLClient({ user: await getAdminUser(context) }).mutate({
            mutation: deleteSiteMetaDataMutation,
            variables: { key: SiteMetaDataKey.TestingKey },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getSiteMetaData: {
                    deleteSiteMetaData: {
                        __typename: "SiteMetaData",
                        key: "_testingKey",
                        value: testSiteMetaData.value,
                    },
                },
            },
        });
    });

    test("Other users cannot update site meta data", async () => {
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: deleteSiteMetaDataMutation,
            variables: { key: SiteMetaDataKey.TestingKey },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getSiteMetaData.deleteSiteMetaData",
            },
        ]);
    });
});
