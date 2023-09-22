import { HttpMethod } from "@/__generated__/resolvers-types";
import { App, Endpoint, User } from "@/database/models";
import { AppPK } from "@/pks/AppPK";
import { EndpointPK } from "@/pks/EndpointPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("listEndpointsByApp", () => {
    let testApp: App;
    let testAppOwner: User;
    let testEndpoint: Endpoint;
    const listEndpointsByAppQuery = graphql(`
        query listEndpointsByApp($app: ID!) {
            listEndpointsByApp(app: $app) {
                pk
            }
        }
    `);

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context, {
            email: "test-user" + uuid.v4(),
        });
        testApp = await context.batched.App.create({
            name: "test-app" + uuid.v4(),
            title: "Test App",
            description: "Test app description",
            homepage: "https://example.com",
            owner: "test-user",
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

    test("should return endpoints", async () => {
        const promise = testGQLClient({ user: testAppOwner }).query({
            query: listEndpointsByAppQuery,
            variables: {
                app: AppPK.stringify(testApp),
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                listEndpointsByApp: [
                    {
                        __typename: "Endpoint",
                        pk: EndpointPK.stringify(testEndpoint),
                    },
                ],
            },
        });
    });

    test("Should not include deleted endpoints", async () => {
        await context.batched.Endpoint.update(testEndpoint, {
            deleted: true,
            deletedAt: Date.now(),
        });
        const promise = testGQLClient({ user: testAppOwner }).query({
            query: listEndpointsByAppQuery,
            variables: {
                app: AppPK.stringify(testApp),
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                listEndpointsByApp: [],
            },
        });
    });
});