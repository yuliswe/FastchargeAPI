import { AppVisibility, GatewayMode } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { baseRequestContext, getOrCreateTestUser } from "@/tests/test-utils";
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
