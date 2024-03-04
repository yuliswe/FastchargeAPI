import { App } from "@/src/database/models/App";
import { AppTag } from "@/src/database/models/AppTag";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { AppTagPK } from "@/src/pks/AppTagPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
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
    const promise = getTestGQLClient({ user: await createTestUser(context, { isAdmin: true }) }).query({
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
