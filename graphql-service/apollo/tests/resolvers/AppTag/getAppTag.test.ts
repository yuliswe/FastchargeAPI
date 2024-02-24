import { App } from "@/src/database/models/App";
import { AppTag } from "@/src/database/models/AppTag";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { AppTagPK } from "@/src/pks/AppTagPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
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
