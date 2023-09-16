import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { AppVisibility, GatewayMode } from "@/__generated__/gql/graphql";
import { User } from "@/database/models";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { getOrCreateTestUser } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

const createAppMutation = graphql(`
    mutation CreateApp(
        $name: String!
        $title: String!
        $description: String!
        $owner: ID!
        $homepage: URL!
        $repository: URL!
        $gatewayMode: GatewayMode!
        $visibility: AppVisibility!
    ) {
        createApp(
            name: $name
            title: $title
            description: $description
            owner: $owner
            homepage: $homepage
            repository: $repository
            gatewayMode: $gatewayMode
            visibility: $visibility
        ) {
            pk
            name
            title
            description
            owner {
                pk
            }
            homepage
            repository
            gatewayMode
            visibility
        }
    }
`);
// jest.retryTimes(2);
describe("createApp", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppName = `testapp-${uuidv4()}`;
    let testUser: User;

    beforeAll(async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });

    test("Anyone can create an app", async () => {
        const promise = testGQLClient({ user: testUser }).mutate({
            mutation: createAppMutation,
            variables: {
                name: testAppName,
                title: "Test App",
                description: "TestApp Description",
                owner: UserPK.stringify(testUser),
                homepage: "https://fastchargeapi.com",
                repository: "https://github/myrepo",
                gatewayMode: GatewayMode.Proxy,
                visibility: AppVisibility.Public,
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                createApp: {
                    __typename: "App",
                    name: testAppName,
                    description: "TestApp Description",
                    pk: expect.any(String),
                    title: "Test App",
                    visibility: AppVisibility.Public,
                    owner: {
                        __typename: "User",
                        pk: UserPK.stringify(testUser),
                    },
                    homepage: "https://fastchargeapi.com",
                    repository: "https://github/myrepo",
                    gatewayMode: GatewayMode.Proxy,
                },
            },
        });
    });
});
