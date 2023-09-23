import { AppVisibility, GatewayMode } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import * as appFunctions from "@/functions/app";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { baseRequestContext, getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context = baseRequestContext;

const updateAppMutation = graphql(`
    mutation TestUpdateAppMutation(
        $appPK: ID!
        $title: String
        $description: String
        $homepage: URL
        $repository: URL
        $visibility: AppVisibility
        $readme: URL
        $logo: URL
    ) {
        getApp(pk: $appPK) {
            updateApp(
                title: $title
                description: $description
                homepage: $homepage
                repository: $repository
                visibility: $visibility
                readme: $readme
                logo: $logo
            ) {
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
            }
        }
    }
`);

describe("updateApp", () => {
    let testApp: App;
    let testOwner: User;
    let testOtherUser: User;
    beforeEach(async () => {
        testOwner = await getOrCreateTestUser(context, {
            email: `testOwner_${uuidv4()}@gmail_mock.com`,
        });
        testOtherUser = await getOrCreateTestUser(context, {
            email: `testOtherUser_${uuidv4()}@gmail_mock.com`,
        });
        testApp = await context.batched.App.create({
            name: `testapp-${uuidv4()}`,
            owner: UserPK.stringify(testOwner),
            title: "Test App",
            description: "Test App Description",
            homepage: "https://fastchargeapi.com",
            repository: "https://github/myrepo",
            gatewayMode: GatewayMode.Proxy,
            visibility: AppVisibility.Public,
            readme: "readme",
        });
    });

    const updateVariables = {
        title: "New Title",
        description: "New Description",
        homepage: "https://newhomepage.com",
        repository: "https://newrepo.com",
        visibility: AppVisibility.Private,
        readme: "https://newreadme.com",
    };

    test("App owner can update their app", async () => {
        const promise = testGQLClient({ user: testOwner }).mutate({
            mutation: updateAppMutation,
            variables: {
                appPK: AppPK.stringify(testApp),
                ...updateVariables,
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getApp: {
                    __typename: "App",
                    updateApp: {
                        __typename: "App",
                        pk: AppPK.stringify(testApp),
                        ...updateVariables,
                    },
                },
            },
        });
    });

    test("When updating an app, the search index is updated.", async () => {
        const updateAppSearchIndexSpy = jest.spyOn(appFunctions, "updateAppSearchIndex");
        await testGQLClient({ user: testOwner }).mutate({
            mutation: updateAppMutation,
            variables: {
                appPK: AppPK.stringify(testApp),
                ...updateVariables,
            },
        });
        expect(updateAppSearchIndexSpy).toHaveBeenCalled();
        expect(updateAppSearchIndexSpy).toHaveBeenCalledWith(expect.anything(), [
            expect.objectContaining(updateVariables),
        ]);
    });

    test("Other users cannot update an app that they don't own.", async () => {
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: updateAppMutation,
            variables: {
                appPK: AppPK.stringify(testApp),
                ...updateVariables,
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getApp.updateApp",
            },
        ]);
    });
});
