import { App } from "@/database/models/App";
import { AppTag } from "@/database/models/AppTag";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { AppTagPK } from "@/pks/AppTagPK";
import { UserPK } from "@/pks/UserPK";
import { baseRequestContext as context, getAdminUser, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const listAppTagsByAppQuery = graphql(`
    query TestListAppTagByApp($app: ID!) {
        listAppTagsByApp(app: $app) {
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
let testAppTag: AppTag;

describe("listAppTagsByApp", () => {
    beforeAll(async () => {
        testAppOwner = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testApp = await context.batched.App.create({
            owner: UserPK.stringify(testAppOwner),
            name: "testapp" + uuid.v4(),
        });
        testAppTag = await context.batched.AppTag.create({
            app: AppPK.stringify(testApp),
            tag: "testtag" + uuid.v4(),
        });
    });

    test("Anyone can list app tags by app", async () => {
        const variables = { app: AppPK.stringify(testApp) };
        const promise = getTestGQLClient({ user: await getAdminUser(context) }).query({
            query: listAppTagsByAppQuery,
            variables,
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                listAppTagsByApp: [
                    {
                        __typename: "AppTag",
                        app: {
                            __typename: "App",
                            pk: AppPK.stringify(testApp),
                        },
                        pk: AppTagPK.stringify(testAppTag),
                        tag: testAppTag.tag,
                    },
                ],
            },
            loading: false,
            networkStatus: 7,
        });
    });
});
