import { App } from "@/src/database/models/App";
import { AppTag } from "@/src/database/models/AppTag";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { createTestApp } from "@/tests/test-data/App";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
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
      deletedAt: new Date(),
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
