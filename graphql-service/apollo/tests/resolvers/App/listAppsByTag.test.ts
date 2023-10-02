import { AppVisibility, GatewayMode } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { AppTag } from "@/database/models/AppTag";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { baseRequestContext, getOrCreateTestUser } from "@/tests/test-utils";
import { testGQLClient } from "@/tests/testGQLClient";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context = baseRequestContext;

let testAppOwner: User;
let testOtherOwner: User;
let testApp: App;
let testAppTag: AppTag;
beforeAll(async () => {
    testAppOwner = await getOrCreateTestUser(context, {
        email: `testAppOwner_${uuidv4()}@gmail_mock.com`,
    });
    testOtherOwner = await getOrCreateTestUser(context, {
        email: `testOtherOwner_${uuidv4()}@gmail_mock.com`,
    });
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
    testAppTag = await context.batched.AppTag.create({
        app: AppPK.stringify(testApp),
        tag: `testtag-${uuidv4()}`,
    });
});

describe("listAppsByTag", () => {
    const queryListAppsByTag = graphql(`
        query TestListAppsByTag($tag: String!) {
            listAppsByTag(tag: $tag) {
                pk
            }
        }
    `);

    test("List apps by tag", async () => {
        const promise = testGQLClient({ user: testOtherOwner }).query({
            query: queryListAppsByTag,
            variables: {
                tag: testAppTag.tag,
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                listAppsByTag: expect.arrayContaining([
                    {
                        __typename: "App",
                        pk: AppPK.stringify(testApp),
                    },
                ]),
            },
        });
    });

    test("Shoud not include soft deleted apps", async () => {
        await context.batched.App.update(testApp, {
            deleted: true,
            deletedAt: Date.now(),
        });
        const promise = testGQLClient({ user: testAppOwner }).query({
            query: queryListAppsByTag,
            variables: {
                tag: testAppTag.tag,
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                listAppsByTag: [],
            },
        });
    });
});
