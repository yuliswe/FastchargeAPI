import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import {
    baseRequestContext as context,
    getAdminUser,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const createAppTagMutation = graphql(`
    mutation TestCreateAppTag($app: String!, $tag: String!) {
        createAppTag(app: $app, tag: $tag) {
            pk
            app {
                pk
            }
            tag
        }
    }
`);

let testAppOwner: User;
let testApp: App;

describe("createAppTag", () => {
    beforeAll(async () => {
        testAppOwner = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testApp = await context.batched.App.create({
            owner: UserPK.stringify(testAppOwner),
            name: "testapp" + uuid.v4(),
        });
    });

    test("Admin user can create app tag", async () => {
        const variables = { app: AppPK.stringify(testApp), tag: "testtag" + uuid.v4() };
        const promise = testGQLClient({ user: await getAdminUser(context) }).mutate({
            mutation: createAppTagMutation,
            variables,
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                createAppTag: {
                    __typename: "AppTag",
                    app: {
                        __typename: "App",
                        pk: AppPK.stringify(testApp),
                    },
                    pk: expect.any(String),
                    tag: variables.tag,
                },
            },
        });
    });

    test("Other user cannot create app tag", async () => {
        const promise = testGQLClient({ user: testAppOwner }).mutate({
            mutation: createAppTagMutation,
            variables: { app: AppPK.stringify(testApp), tag: "testtag" + uuid.v4() },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "createAppTag",
            },
        ]);
    });
});
