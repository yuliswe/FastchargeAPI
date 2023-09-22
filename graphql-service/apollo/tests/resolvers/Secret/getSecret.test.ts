import { Secret, User } from "@/database/models";
import { SecretPK } from "@/pks/SecretPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { baseRequestContext as context, getOrCreateTestUser } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("getSecret", () => {
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

    test("Anyone can get a secret", async () => {
        const { key, value, expireAt } = testSecret;
        const promise = testGQLClient({ user: testUser }).query({
            query: graphql(`
                query TestGetSecret($key: String!) {
                    getSecret(key: $key) {
                        pk
                        key
                        value
                        expireAt
                        createdAt
                    }
                }
            `),
            variables: {
                key,
            },
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getSecret: {
                    pk: SecretPK.stringify(testSecret),
                    key,
                    value,
                    expireAt,
                    createdAt: expect.any(Number),
                },
            },
        });
    });
});