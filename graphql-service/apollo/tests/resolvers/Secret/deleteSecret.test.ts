import { Secret } from "@/database/models/Secret";
import { User } from "@/database/models/User";
import { SecretPK } from "@/pks/SecretPK";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("deleteSecret", () => {
  let testSecret: Secret;
  let testUser: User;

  beforeAll(async () => {
    testSecret = await context.batched.Secret.create({
      key: "test-secret-key" + uuid.v4(),
      value: "test-secret-val" + uuid.v4(),
      expireAt: Date.now(),
    });
    testUser = await getOrCreateTestUser(context, {
      email: "test-user" + uuid.v4(),
    });
  });

  test("Anyone can delete a secret", async () => {
    const promise = getTestGQLClient({ user: testUser }).query({
      query: graphql(`
        mutation TestDeleteSecret($key: String!) {
          getSecret(key: $key) {
            deleteSecret {
              pk
            }
          }
        }
      `),
      variables: {
        key: testSecret.key,
      },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getSecret: {
          deleteSecret: {
            pk: SecretPK.stringify(testSecret),
          },
        },
      },
    });
  });
});
