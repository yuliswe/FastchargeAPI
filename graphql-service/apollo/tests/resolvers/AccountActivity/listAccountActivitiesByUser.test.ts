import { AccountActivity } from "@/database/models/AccountActivity";
import { User } from "@/database/models/User";
import { AccountActivityPK } from "@/pks/AccountActivityPK";
import { UserPK } from "@/pks/UserPK";
import { createTestAccountActivity } from "@/tests/test-data/AccountActivity";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context, getGraphQLDataOrError } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";

describe("listAccountActivitiesByUser", () => {
  let testUser: User;
  let testAccountActivities: AccountActivity[];

  beforeEach(async () => {
    testUser = await createTestUser(context);
    testAccountActivities = await Promise.all([
      createTestAccountActivity(context, { user: UserPK.stringify(testUser) }),
      createTestAccountActivity(context, { user: UserPK.stringify(testUser) }),
      createTestAccountActivity(context, { user: UserPK.stringify(testUser) }),
    ]);
  });

  async function queryListAccountActivitiesByUser(args: { requestUser: User; accountActivityUser: User }) {
    const { requestUser, accountActivityUser } = args;
    const result = await getTestGQLClient({ user: requestUser }).query({
      query: graphql(`
        query ListAccountActivitiesByUser($user: ID!) {
          listAccountActivitiesByUser(user: $user) {
            pk
          }
        }
      `),
      variables: {
        user: UserPK.stringify(accountActivityUser),
      },
    });
    return result;
  }

  test("Users can list their own account activities", async () => {
    const accountActivities = await queryListAccountActivitiesByUser({
      requestUser: testUser,
      accountActivityUser: testUser,
    });
    expect(accountActivities.data.listAccountActivitiesByUser.map((a) => a.pk)).toEqualStringArrayIgnoringOrder(
      testAccountActivities.map((a) => AccountActivityPK.stringify(a))
    );
  });

  test("A user cannot list other user's account activities", async () => {
    const otherUser = await createTestUser(context);
    const promise = queryListAccountActivitiesByUser({
      requestUser: otherUser,
      accountActivityUser: testUser,
    });
    await expect(getGraphQLDataOrError(promise)).rejects.toMatchSnapshot();
  });
});
