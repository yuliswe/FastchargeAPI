import { SiteMetaDataKey } from "@/__generated__/resolvers-types";
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
        const promise = testGQLClient({ user: await getAdminUser(context) }).mutate({
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
        const promise = testGQLClient({ user: testOtherUser }).mutate({
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
