import { AppVisibility, GatewayMode } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { createTestUser } from "@/tests/examples/User";
import { baseRequestContext, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { getTestGQLClient } from "@/tests/testGQLClients";
import { graphql } from "@/typed-graphql";
import { describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context = baseRequestContext;

let testAppOwner: User;
let testOtherOwner: User;
let testApp: App;
beforeEach(async () => {
    testAppOwner = await createTestUser(context);
    testOtherOwner = await createTestUser(context);
    testApp = await context.batched.App.create({
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
        const promise = getTestGQLClient({ user: testOtherOwner }).query({
            query: queryGetAppByPK,
            variables: {
                pk: AppPK.stringify(testApp),
            },
        });
        await expect(promise).resolves.toMatchSnapshotExceptForProps({
            data: {
                getApp: {
                    pk: expect.any(String),
                    name: testApp.name,
                    createdAt: expect.any(Number),
                    updatedAt: expect.any(Number),
                    owner: {
                        author: testAppOwner.author,
                    },
                },
            },
        });
    });

    test("Get a deleted app should reject", async () => {
        await context.batched.App.update(testApp, {
            deleted: true,
            deletedAt: Date.now(),
        });
        const promise = getTestGQLClient({ user: testOtherOwner }).query({
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
