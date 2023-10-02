import { SiteMetaDataKey } from "@/__generated__/resolvers-types";
import { SiteMetaData } from "@/database/models/SiteMetaData";
import { User } from "@/database/models/User";
import {
    baseRequestContext as context,
    getAdminUser,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { testGQLClient } from "@/tests/testGQLClient";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const updateSiteMetaDataMutation = graphql(`
    mutation TestupdateSiteMetaData($key: String!, $value: Any!) {
        getSiteMetaDataByKey(key: $key) {
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
    let testSiteMetaData: SiteMetaData;
    beforeEach(async () => {
        testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testSiteMetaData = await context.batched.SiteMetaData.createOverwrite({
            key: ("testkey-" + uuid.v4()) as SiteMetaDataKey,
            value: "testvalue" + uuid.v4(),
        });
    });

    function getVariables() {
        return { key: testSiteMetaData.key, value: "testvalue" + uuid.v4() };
    }

    test("Admin can update site meta data", async () => {
        const variables = getVariables();
        const promise = testGQLClient({ user: await getAdminUser(context) }).mutate({
            mutation: updateSiteMetaDataMutation,
            variables,
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getSiteMetaDataByKey: {
                    updateSiteMetaData: {
                        __typename: "SiteMetaData",
                        key: testSiteMetaData.key,
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
            variables: getVariables(),
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getSiteMetaDataByKey.updateSiteMetaData",
            },
        ]);
    });
});
