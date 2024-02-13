import crypto from "crypto";
import { EncryptJWT, JWTPayload, SignJWT, jwtDecrypt, jwtVerify } from "jose";
import { graphql } from "src/__generated__/gql";
import { getGQLClient } from "src/graphqlClient";
import { NotFoundSimpleGQLError } from "src/simplifiedGQLErrors";

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
  return jweDecrypted.payload["body"] as object;
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
  const encrypted = await new EncryptJWT({ body })
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

export function createSecret(args?: { nbits: number }): Uint8Array {
  const { nbits = 512 } = args ?? {};
  const secret = new Uint8Array(nbits / 8);
  crypto.getRandomValues(secret);
  return secret;
}

export const hex = (arr: Uint8Array) =>
  Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const createRandomHex = (args: { nchars: number }) => {
  const { nchars } = args;
  const arr = new Uint8Array(nchars / 2);
  crypto.getRandomValues(arr);
  return hex(arr);
};

type SendSecretsProps = { jweSecret: Uint8Array; jwtSecret: Uint8Array; key: string };
export function waitForSecretContent(options: {
  sendSecrets: (args: SendSecretsProps) => void | Promise<void>;
  /** Overrides the auto generated secrets. Useful for testing. */
  jweSecret?: Uint8Array;
  /** Overrides the auto generated secrets. Useful for testing. */
  jwtSecret?: Uint8Array;
  /** Overrides the auto generated key. Useful for testing. */
  key?: string;
  timeoutSeconds: number;
}): Promise<object> {
  const { sendSecrets, timeoutSeconds } = options;
  return new Promise((resolve, reject) => {
    const jweSecret = options.jweSecret ?? createSecret({ nbits: 512 });
    const jwtSecret = options.jwtSecret ?? createSecret({ nbits: 512 });
    const key = options.key ?? createRandomHex({ nchars: 32 });
    void sendSecrets({ jweSecret, jwtSecret, key });
    const startTime = Date.now();
    void (async () => {
      while (Date.now() - startTime < timeoutSeconds * 1000) {
        try {
          const value = await getRemoteSecret({ key, jweSecret, jwtSecret });
          resolve(value);
        } catch (e) {
          if (e instanceof NotFoundSimpleGQLError && e.resource === "Secret") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          reject(e);
        }
        break;
      }
      reject(new Error("Timeout"));
    })();
  });
}
