import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { createTestApp } from "@/tests/test-data/App";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context, getGraphQLDataOrError } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";

describe("listAppsByOwner", () => {
  let testAppOwner: User;
  let testOtherOwner: User;
  let testApp: App;

  beforeEach(async () => {
    testAppOwner = await createTestUser(context);
    testOtherOwner = await createTestUser(context);
    testApp = await createTestApp(context, {
      owner: UserPK.stringify(testAppOwner),
    });
  });

  const queryListAppsByOwner = graphql(`
    query TestListAppsByOwner($owner: ID!) {
      listAppsByOwner(owner: $owner) {
        pk
      }
    }
  `);

  test("List apps by owner", async () => {
    const promise = getTestGQLClient({ user: testOtherOwner }).query({
      query: queryListAppsByOwner,
      variables: {
        owner: UserPK.stringify(testAppOwner),
      },
    });
    await expect(getGraphQLDataOrError(promise)).resolves.toMatchSnapshotExceptForProps({
      listAppsByOwner: [{ pk: AppPK.stringify(testApp) }],
    });
  });

  test("Shoud not include soft deleted apps", async () => {
    await context.batched.App.update(testApp, {
      deleted: true,
      deletedAt: Date.now(),
    });
    const promise = getTestGQLClient({ user: testAppOwner }).query({
      query: queryListAppsByOwner,
      variables: {
        owner: UserPK.stringify(testAppOwner),
      },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        listAppsByOwner: [],
      },
    });
  });
});
