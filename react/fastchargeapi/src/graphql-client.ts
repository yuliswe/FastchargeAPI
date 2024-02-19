import { ApolloClient, InMemoryCache, TypedDocumentNode, createHttpLink, from as linksFrom } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { EncryptJWT, JWTPayload, SignJWT } from "jose";
import { AppContext } from "./AppContext";
import { graphql } from "./__generated__/gql/gql";
import { ENV_DEV_DOMAIN, ENV_LOCAL_GRAPHQL, baseDomain, graphqlURL } from "./runtime";
// debug

if (ENV_DEV_DOMAIN) {
  console.warn("Using dev domain:", baseDomain);
}

if (ENV_LOCAL_GRAPHQL) {
  console.warn("Using local graphql server:", graphqlURL);
}

/**
 * Connects to the graphql server specified by uri.
 * @param param0
 * @returns
 */
export async function getGQLClient(
  context: AppContext
): Promise<{ client: ApolloClient<unknown>; currentUser?: string }> {
  const httpLink = createHttpLink({
    uri: graphqlURL,
  });

  const user = await context.firebase.userPromise;
  const idToken = await user.getIdToken(true);

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: idToken,
        "x-user-email": ENV_LOCAL_GRAPHQL ? user.email ?? undefined : undefined,
      } as Record<string, string | undefined>,
    };
  });

  // const cacheLink = createPersistedQueryLink({
  //   sha256: (content: string) =>
  //     hash(content, {
  //       algorithm: "sha256",
  //     }),
  //   useGETForHashedQueries: true,
  // });

  const client = new ApolloClient({
    link: linksFrom([authLink, httpLink]),
    cache: new InMemoryCache(),
  });

  if (user.isAnonymous) {
    return { client };
  }

  if (!user.email) {
    throw new Error("getGQLClient: User email is required");
  }

  const response = await client.query({
    query: graphql(`
      query GetUserPKByEmail($email: Email!) {
        getUserByEmail(email: $email) {
          pk
        }
      }
    `),
    variables: {
      email: user.email,
    },
  });
  return { client, currentUser: response.data.getUserByEmail.pk };
}

export function createSecret(): Uint8Array {
  const secret = new Uint8Array(64);
  window.crypto.getRandomValues(secret);
  return secret;
}

export async function encryptAndSign(
  body: JWTPayload,
  args: {
    jweSecret: Uint8Array;
    jwtSecret: Uint8Array;
  }
): Promise<string> {
  const { jweSecret, jwtSecret } = args;
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

export async function setRemoteSecret(
  context: AppContext,
  args: {
    key: string;
    value: JWTPayload;
    description?: string;
    expireAt?: number;
  },
  {
    jweSecret,
    jwtSecret,
  }: {
    jweSecret: Uint8Array;
    jwtSecret: Uint8Array;
  }
) {
  const { key, value, description, expireAt } = args;
  console.log("setRemoteSecret", key, value, description, expireAt, jweSecret, jwtSecret);
  const signedValue = await encryptAndSign(value, { jweSecret, jwtSecret });
  const { client } = await getGQLClient(context);
  const response = await client.mutate({
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

export type GetQueryResult<T> = T extends TypedDocumentNode<infer U, unknown> ? U : never;
