import { App } from "@/database/models/App";
import { AppTag } from "@/database/models/AppTag";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { createTestApp } from "@/tests/examples/App";
import { createTestUser } from "@/tests/examples/User";
import { baseRequestContext as context } from "@/tests/test-utils";
import { getTestGQLClient } from "@/tests/testGQLClients";
import { graphql } from "@/typed-graphql";
import { describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

describe("listAppsByTag", () => {
    let testAppOwner: User;
    let testOtherOwner: User;
    let testApp: App;
    let testAppTag: AppTag;

    beforeEach(async () => {
        testAppOwner = await createTestUser(context);
        testOtherOwner = await createTestUser(context);
        testApp = await createTestApp(context, {
            owner: UserPK.stringify(testAppOwner),
        });
        testAppTag = await context.batched.AppTag.create({
            app: AppPK.stringify(testApp),
            tag: `testtag-${uuidv4()}`,
        });
    });

    const queryListAppsByTag = graphql(`
        query TestListAppsByTag($tag: String!) {
            listAppsByTag(tag: $tag) {
                pk
            }
        }
    `);

    test("List apps by tag", async () => {
        const promise = getTestGQLClient({ user: testOtherOwner }).query({
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
        const promise = getTestGQLClient({ user: testAppOwner }).query({
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
