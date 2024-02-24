import { App } from "@/src/database/models/App";
import { AppTag } from "@/src/database/models/AppTag";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { AppTagPK } from "@/src/pks/AppTagPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import {
  baseRequestContext as context,
  getAdminUser,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

const deleteAppTagMutation = graphql(`
  mutation TestdeleteAppTag($pk: ID!) {
    getAppTag(pk: $pk) {
      deleteAppTag {
        pk
        app {
          pk
        }
        tag
      }
    }
  }
`);

let testAppOwner: User;
let testOtherUser: User;
let testApp: App;
let testAppTag: AppTag;

describe("deleteAppTag", () => {
  beforeEach(async () => {
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

  test("App ower can delete app tag", async () => {
    const promise = getTestGQLClient({ user: testAppOwner }).mutate({
      mutation: deleteAppTagMutation,
      variables: { pk: AppTagPK.stringify(testAppTag) },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getAppTag: {
          deleteAppTag: {
            __typename: "AppTag",
            app: {
              __typename: "App",
              pk: AppPK.stringify(testApp),
            },
            pk: AppTagPK.stringify(testAppTag),
            tag: testAppTag.tag,
          },
        },
      },
    });
  });

  test("Admin can delete app tag", async () => {
    const promise = getTestGQLClient({ user: await getAdminUser(context) }).mutate({
      mutation: deleteAppTagMutation,
      variables: { pk: AppTagPK.stringify(testAppTag) },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getAppTag: {
          deleteAppTag: {
            __typename: "AppTag",
            app: {
              __typename: "App",
              pk: AppPK.stringify(testApp),
            },
            pk: AppTagPK.stringify(testAppTag),
            tag: testAppTag.tag,
          },
        },
      },
    });
  });

  test("Non-owner cannot update app tag", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      mutation: deleteAppTagMutation,
      variables: { pk: AppTagPK.stringify(testAppTag) },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getAppTag.deleteAppTag",
      },
    ]);
  });
});
