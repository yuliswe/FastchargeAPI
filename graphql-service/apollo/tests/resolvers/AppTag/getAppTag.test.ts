import { App } from "@/database/models/App";
import { AppTag } from "@/database/models/AppTag";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { AppTagPK } from "@/pks/AppTagPK";
import { UserPK } from "@/pks/UserPK";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils";
import { getTestGQLClient } from "@/tests/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const getAppTagQuery = graphql(`
    query TestGetAppTag($tag: ID!) {
        getAppTag(pk: $tag) {
            pk
            app {
                pk
            }
            tag
            createdAt
            updatedAt
        }
    }
`);

let testAppOwner: User;
let testOtherUser: User;
let testApp: App;
let testAppTag: AppTag;

describe("getAppTag", () => {
    beforeAll(async () => {
        testAppOwner = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testApp = await context.batched.App.create({
            owner: UserPK.stringify(testAppOwner),
            name: "testapp" + uuid.v4(),
        });
        testAppTag = await context.batched.AppTag.create({
            app: AppPK.stringify(testApp),
            tag: "testtag" + uuid.v4(),
        });
    });

    test("Anyone can get app tag", async () => {
        const variables = { app: AppPK.stringify(testApp), tag: AppTagPK.stringify(testAppTag) };
        const promise = getTestGQLClient({ user: testOtherUser }).query({
            query: getAppTagQuery,
            variables,
        });
        const { tag, createdAt, updatedAt } = testAppTag;
        await expect(promise).resolves.toMatchObject({
            data: {
                getAppTag: {
                    __typename: "AppTag",
                    app: {
                        __typename: "App",
                        pk: AppPK.stringify(testApp),
                    },
                    pk: AppTagPK.stringify(testAppTag),
                    tag,
                    createdAt,
                    updatedAt,
                },
            },
        });
    });
});
