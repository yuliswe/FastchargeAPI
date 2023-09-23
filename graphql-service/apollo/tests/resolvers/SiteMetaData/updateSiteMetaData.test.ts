import { SiteMetaDataKey } from "@/__generated__/resolvers-types";
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

const updateSiteMetaDataMutation = graphql(`
    mutation TestupdateSiteMetaData($key: SiteMetaDataKey!, $value: Any!) {
        getSiteMetaData(key: $key) {
            updateSiteMetaData(value: $value) {
                key
                value
                createdAt
                updatedAt
            }
        }
    }
`);

describe("updateSiteMetaData", () => {
    let testOtherUser: User;
    beforeEach(async () => {
        await context.batched.SiteMetaData.deleteIfExists({ key: SiteMetaDataKey.TestingKey });
        testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        await context.batched.SiteMetaData.getOrCreate({
            key: SiteMetaDataKey.TestingKey,
            value: "testvalue" + uuid.v4(),
        });
    });

    test("Admin can update site meta data", async () => {
        const variables = { key: SiteMetaDataKey.TestingKey, value: "testvalue" + uuid.v4() };
        const promise = testGQLClient({ user: await getAdminUser(context) }).mutate({
            mutation: updateSiteMetaDataMutation,
            variables,
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getSiteMetaData: {
                    updateSiteMetaData: {
                        __typename: "SiteMetaData",
                        key: "_testingKey",
                        value: variables.value,
                        updatedAt: expect.any(Number),
                        createdAt: expect.any(Number),
                    },
                },
            },
        });
    });

    test("Other users cannot update site meta data", async () => {
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: updateSiteMetaDataMutation,
            variables: { key: SiteMetaDataKey.TestingKey, value: "testvalue" + uuid.v4() },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getSiteMetaData.updateSiteMetaData",
            },
        ]);
    });
});
