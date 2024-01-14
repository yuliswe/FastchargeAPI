import { AppVisibility, GatewayMode } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { createTestApp } from "@/tests/test-data/App";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context, getGraphQLDataOrError } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { v4 as uuidv4 } from "uuid";

let testAppOwner: User;
let testOtherOwner: User;
let testApp: App;
describe("getAppByName", () => {
  const queryGetAppByName = graphql(`
    query TestGetAppByName($name: String!) {
      getAppByName(name: $name) {
        pk
        name
      }
    }
  `);

  beforeEach(async () => {
    testAppOwner = await createTestUser(context);
    testApp = await createTestApp(context, {
      name: `testapp-${uuidv4()}`,
      owner: UserPK.stringify(testAppOwner),
      title: "Test App",
      description: "Test App Description",
      homepage: "https://fastchargeapi.com",
      repository: "https://github/myrepo",
      gatewayMode: GatewayMode.Proxy,
      visibility: AppVisibility.Public,
      readme: "readme",
    });
    testOtherOwner = await createTestUser(context);
  });

  test("Can get a public app by name", async () => {
    const promise = getTestGQLClient({ user: testOtherOwner }).query({
      query: queryGetAppByName,
      variables: {
        name: testApp.name,
      },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getAppByName: {
          __typename: "App",
          pk: AppPK.stringify(testApp),
          name: testApp.name,
        },
      },
    });
  });

  test("Get a deleted app should reject", async () => {
    await context.batched.App.update(testApp, {
      deleted: true,
      deletedAt: Date.now(),
    });
    const promise = getTestGQLClient({ user: testOtherOwner }).query({
      query: queryGetAppByName,
      variables: {
        name: testApp.name,
      },
    });
    await expect(getGraphQLDataOrError(promise)).rejects.toMatchSnapshot();
  });
});
