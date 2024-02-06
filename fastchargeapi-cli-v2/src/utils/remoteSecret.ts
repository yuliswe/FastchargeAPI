import crypto from "crypto";
import { EncryptJWT, JWTPayload, SignJWT, jwtDecrypt, jwtVerify } from "jose";
import { graphql } from "src/__generated__/gql";
import { getGQLClient } from "src/graphqlClient";

export async function getRemoteSecret(args: {
  key: string;
  jweSecret: Uint8Array;
  jwtSecret: Uint8Array;
}): Promise<object> {
  const { key, jweSecret, jwtSecret } = args;
  const resp = await getGQLClient().query({
    query: graphql(`
      query GetSecret($key: String!) {
        getSecret(key: $key) {
          value
        }
      }
    `),
    variables: { key },
  });

  const secret = resp.data.getSecret.value;

  const jwtVerified = await jwtVerify(secret, jwtSecret, { algorithms: ["HS512"] });

  const { encrypted } = jwtVerified.payload as { encrypted: string };
  const jweDecrypted = await jwtDecrypt(encrypted, jweSecret);
  return jweDecrypted.payload;
}

export async function setRemoteSecret(args: {
  key: string;
  value: JWTPayload;
  description?: string;
  expireAt?: number;
  jweSecret: Uint8Array;
  jwtSecret: Uint8Array;
}) {
  const { key, value, description, expireAt, jweSecret, jwtSecret } = args;
  const signedValue = await encryptAndSign(value, { jweSecret, jwtSecret });
  const response = await getGQLClient().mutate({
    mutation: graphql(`
      mutation PutSecret($key: String!, $signedValue: String!, $description: String, $expireAt: Timestamp) {
        createSecret(key: $key, value: $signedValue, description: $description, expireAt: $expireAt) {
          createdAt
        }
      }
    `),
    variables: {
      key,
      signedValue,
      description,
      expireAt,
    },
  });
  return response;
}

export async function encryptAndSign(
  body: JWTPayload,
  options: {
    jweSecret: Uint8Array;
    jwtSecret: Uint8Array;
  }
): Promise<string> {
  const { jweSecret, jwtSecret } = options;
  const encrypted = await new EncryptJWT(body)
    .setIssuedAt()
    .setIssuer("fastchargeapi.com")
    .setAudience("fastchargeapi.com")
    .setProtectedHeader({
      alg: "dir",
      enc: "A256CBC-HS512",
    })
    .encrypt(jweSecret);

  const signed = await new SignJWT({
    encrypted,
  })
    .setProtectedHeader({
      alg: "HS512",
    })
    .sign(jwtSecret);
  return signed;
}

export function createSecret(): Uint8Array {
  const secret = new Uint8Array(64);
  crypto.getRandomValues(secret);
  return secret;
}

export function createSecretPair(): { jweSecret: Uint8Array; jwtSecret: Uint8Array } {
  return { jweSecret: createSecret(), jwtSecret: createSecret() };
}
