import { AppVisibility, GatewayMode } from "@/__generated__/gql/graphql";
import { App, User } from "@/database/models";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { baseRequestContext, getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context = baseRequestContext;

let testAppOwner: User;
let testOtherOwner: User;
let testApp: App;
beforeAll(async () => {
    testAppOwner = await getOrCreateTestUser(context, {
        email: `testAppOwner_${uuidv4()}@gmail_mock.com`,
    });
    testOtherOwner = await getOrCreateTestUser(context, {
        email: `testOtherOwner_${uuidv4()}@gmail_mock.com`,
    });
    testApp = await context.batched.App.getOrCreate({
        name: `testapp-${uuidv4()}`,
        owner: UserPK.stringify(testAppOwner),
        title: "Test App",
        description: "Test App Description",
        homepage: "https://fastchargeapi.com",
        repository: "https://github/myrepo",
        gatewayMode: GatewayMode.Proxy,
        visibility: AppVisibility.Public,
        readme: "readme",
    });
});

describe("getApp", () => {
    const queryGetAppByPK = graphql(`
        query TestGetAppByPK($pk: ID!) {
            getApp(pk: $pk) {
                pk
                name
                title
                description
                owner {
                    author
                }
                homepage
                repository
                gatewayMode
                visibility
                createdAt
                updatedAt
                readme
                pricingPlans {
                    pk
                }
                endpoints {
                    pk
                }
                tags {
                    pk
                }
            }
        }
    `);

    test("Anyone can get a public app", async () => {
        const promise = testGQLClient({ user: testOtherOwner }).query({
            query: queryGetAppByPK,
            variables: {
                pk: AppPK.stringify(testApp),
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getApp: {
                    __typename: "App",
                    pk: AppPK.stringify(testApp),
                    name: testApp.name,
                    title: testApp.title,
                    description: testApp.description,
                    owner: {
                        __typename: "User",
                        author: testAppOwner.author,
                    },
                    homepage: testApp.homepage,
                    repository: testApp.repository,
                    gatewayMode: testApp.gatewayMode,
                    visibility: testApp.visibility,
                    createdAt: testApp.createdAt,
                    updatedAt: testApp.updatedAt,
                    readme: testApp.readme,
                    pricingPlans: [],
                    endpoints: [],
                    tags: [],
                },
            },
        });
    });

    test("Get a deleted app should reject", async () => {
        await context.batched.App.update(testApp, {
            deleted: true,
            deletedAt: Date.now(),
        });
        const promise = testGQLClient({ user: testOtherOwner }).query({
            query: queryGetAppByPK,
            variables: {
                pk: AppPK.stringify(testApp),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "RESOURCE_DELETED",
                message: "This resource has been removed and will soon be deleted.",
                path: "getApp",
            },
        ]);
    });
});

describe("getAppByName", () => {
    const queryGetAppByName = graphql(`
        query TestGetAppByName($name: String!) {
            getAppByName(name: $name) {
                pk
                name
            }
        }
    `);

    test("Can get a public app by name", async () => {
        const promise = testGQLClient({ user: testOtherOwner }).query({
            query: queryGetAppByName,
            variables: {
                name: testApp.name,
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getAppByName: {
                    __typename: "App",
                    pk: AppPK.stringify(testApp),
                    name: testApp.name,
                },
            },
        });
    });
});
