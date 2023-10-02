import { HttpMethod } from "@/__generated__/resolvers-types";
import { App } from "@/database/models/App";
import { Endpoint } from "@/database/models/Endpoint";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { EndpointPK } from "@/pks/EndpointPK";
import { UserPK } from "@/pks/UserPK";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { testGQLClient } from "@/tests/testGQLClient";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const deleteEndpointMutation = graphql(`
    mutation TestDeleteEndpointMutation($pk: ID!) {
        getEndpoint(pk: $pk) {
            deleteEndpoint {
                pk
                deleted
                deletedAt
            }
        }
    }
`);

describe("getEndpoint", () => {
    let testApp: App;
    let testAppOwner: User;
    let testOtherUser: User;
    let testEndpoint: Endpoint;

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context, {
            email: "test-user" + uuid.v4(),
        });
        testOtherUser = await getOrCreateTestUser(context, {
            email: "test-user" + uuid.v4(),
        });
        testApp = await context.batched.App.create({
            name: "test-app" + uuid.v4(),
            title: "Test App",
            description: "Test app description",
            homepage: "https://example.com",
            owner: UserPK.stringify(testAppOwner),
            repository: "",
        });
        testEndpoint = await context.batched.Endpoint.create({
            app: AppPK.stringify(testApp),
            description: "Test endpoint description",
            path: "/test-endpoint",
            method: HttpMethod.Get,
            destination: "https://example.com",
        });
    });

    test("App owner can delete endpoint", async () => {
        const promise = testGQLClient({ user: testAppOwner }).mutate({
            mutation: deleteEndpointMutation,
            variables: {
                pk: EndpointPK.stringify(testEndpoint),
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getEndpoint: {
                    deleteEndpoint: {
                        pk: EndpointPK.stringify(testEndpoint),
                        deleted: true,
                        deletedAt: expect.any(Number),
                    },
                },
            },
        });
    });

    test("Other user cannot delete endpoint", async () => {
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: deleteEndpointMutation,
            variables: {
                pk: EndpointPK.stringify(testEndpoint),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getEndpoint.deleteEndpoint",
            },
        ]);
    });
});
