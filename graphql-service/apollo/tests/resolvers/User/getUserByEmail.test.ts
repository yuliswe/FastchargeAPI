import { User } from "@/database/models/User";
import { UserPK } from "@/pks/UserPK";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";

const getUserByEmail = graphql(`
  query TestGetUserByEmail($email: Email!) {
    getUserByEmail(email: $email) {
      pk
    }
  }
`);

describe("getUserByEmail", () => {
  let testUser: User;

  beforeAll(async () => {
    testUser = await createTestUser(context);
  });

  test("returns user", async () => {
    const result = await getTestGQLClient({ user: testUser }).query({
      query: getUserByEmail,
      variables: {
        email: testUser.email,
      },
    });
    expect(result.data.getUserByEmail).toMatchSnapshotExceptForProps({
      pk: UserPK.stringify(testUser),
    });
  });
});
