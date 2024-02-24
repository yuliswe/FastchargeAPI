import { User } from "@/src/database/models/User";
import { graphql } from "@/src/typed-graphql";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

describe("createSecret", () => {
  let testUser: User;

  beforeAll(async () => {
    testUser = await getOrCreateTestUser(context, {
      email: "test-user" + uuid.v4(),
    });
  });

  test("Anyone can create a secret", async () => {
    const variables = {
      key: "test-secret-key" + uuid.v4(),
      value: "test-secret-val" + uuid.v4(),
      expireAt: Date.now(),
    };
    const promise = getTestGQLClient({ user: testUser }).query({
      query: graphql(`
        mutation TestCreateSecret($key: String!, $value: String!, $expireAt: Timestamp) {
          createSecret(key: $key, value: $value, expireAt: $expireAt) {
            pk
            key
            value
            expireAt
            createdAt
          }
        }
      `),
      variables,
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        createSecret: {
          key: variables.key,
          value: variables.value,
          expireAt: variables.expireAt,
          pk: expect.any(String),
          createdAt: expect.any(Number),
        },
      },
    });
  });
});
