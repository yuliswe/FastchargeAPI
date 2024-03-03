import { App } from "@/src/database/models/App";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { createTestApp } from "@/tests/test-data/App";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context, getGraphQLDataOrError } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";

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
      deletedAt: new Date(),
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
