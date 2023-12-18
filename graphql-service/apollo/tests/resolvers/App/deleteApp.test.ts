import { AppVisibility } from "@/__generated__/gql/graphql";
import { GatewayMode } from "@/__generated__/resolvers-types";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import {
  baseRequestContext,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context = baseRequestContext;

const deleteAppMutation = graphql(`
  mutation DeleteApp($pk: ID!) {
    getApp(pk: $pk) {
      deleteApp {
        deleted
        deletedAt
      }
    }
  }
`);
describe("deleteApp", () => {
  let testApp: App;
  let testOwner: User;
  let testOtherUser: User;
  beforeEach(async () => {
    testOwner = await getOrCreateTestUser(context, {
      email: `testOwner_${uuidv4()}@gmail_mock.com`,
    });
    testOtherUser = await getOrCreateTestUser(context, {
      email: `testOtherUser_${uuidv4()}@gmail_mock.com`,
    });
    testApp = await context.batched.App.create({
      name: `testapp-${uuidv4()}`,
      owner: UserPK.stringify(testOwner),
      title: "Test App",
      description: "Test App Description",
      homepage: "https://fastchargeapi.com",
      repository: "https://github/myrepo",
      gatewayMode: GatewayMode.Proxy,
      visibility: AppVisibility.Public,
      readme: "readme",
    });
  });

  test("Owner can delete an app", async () => {
    const promise = getTestGQLClient({ user: testOwner }).mutate({
      mutation: deleteAppMutation,
      variables: {
        pk: AppPK.stringify(testApp),
      },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getApp: {
          deleteApp: {
            deleted: true,
            deletedAt: expect.any(Number),
          },
        },
      },
    });
  });

  test("Other users cannot delete an app that they don't own", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      mutation: deleteAppMutation,
      variables: {
        pk: AppPK.stringify(testApp),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getApp.deleteApp",
      },
    ]);
  });
});
