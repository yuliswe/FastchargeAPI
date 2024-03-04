import { App } from "@/src/database/models/App";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { createTestUser } from "@/tests/test-data/User";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

const createAppTagMutation = graphql(`
  mutation TestCreateAppTag($app: ID!, $tag: String!) {
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
    const promise = getTestGQLClient({ user: await createTestUser(context, { isAdmin: true }) }).mutate({
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
    const promise = getTestGQLClient({ user: testAppOwner }).mutate({
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
