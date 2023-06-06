import { ApolloClient, InMemoryCache, createHttpLink, gql } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { SQSClient } from "@aws-sdk/client-sqs";
import { sha256 } from "crypto-hash";
import * as jose from "jose";
import { AppContext } from "./AppContext";

// debug
const ENV_LOCAL_GRAPHQL = process.env.REACT_APP_LOCAL_GRAPHQL === "1";
const ENV_DEV_DOMAIN = process.env.REACT_APP_DEV_DOMAIN === "1";
const baseDomain = ENV_DEV_DOMAIN ? "devfastchargeapi.com" : "fastchargeapi.com";
const graphqlURL = ENV_LOCAL_GRAPHQL ? "http://localhost:4000" : `https://api.graphql.${baseDomain}`;

if (ENV_DEV_DOMAIN) {
    console.warn("Using dev domain:", baseDomain);
}

if (ENV_LOCAL_GRAPHQL) {
    console.warn("Using local graphql server:", graphqlURL);
}

const sqsClient = new SQSClient({ region: "us-east-1" });
const cache = new InMemoryCache();

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
    if (!user) {
        throw new Error("getGQLClient: User Not logged in");
    }
    const idToken = await user.getIdToken(true);

    const authLink = setContext((_, { headers }) => {
        return {
            headers: {
                ...headers,
                authorization: idToken,
                "x-user-email": ENV_LOCAL_GRAPHQL ? user?.email ?? undefined : undefined,
            },
        };
    });

    const cacheLink = createPersistedQueryLink({ sha256, useGETForHashedQueries: true });

    const client = new ApolloClient({
        link: authLink.concat(cacheLink).concat(httpLink),
        cache: new InMemoryCache(),
    });

    if (user.isAnonymous) {
        return { client };
    }

    const response = await client.query({
        query: gql`
            query GetUserPKByEmail($email: Email!) {
                user(email: $email) {
                    pk
                }
            }
        `,
        variables: {
            email: user.email,
        },
    });
    return { client, currentUser: response.data.user.pk };
}

export function createSecret(): Uint8Array {
    const secret = new Uint8Array(64);
    window.crypto.getRandomValues(secret);
    return secret;
}

export async function encryptAndSign(
    body: jose.JWTPayload,
    {
        jweSecret,
        jwtSecret,
    }: {
        jweSecret: Uint8Array;
        jwtSecret: Uint8Array;
    }
): Promise<string> {
    // if (!jweSecret) {
    //     jweSecret = createSecret();
    // }
    // if (!jwtSecret) {
    //     jwtSecret = createSecret();
    // }
    let encrypted = await new jose.EncryptJWT(body)
        .setIssuedAt()
        .setIssuer("fastchargeapi.com")
        .setAudience("fastchargeapi.com")
        .setProtectedHeader({
            alg: "dir",
            enc: "A256CBC-HS512",
        })
        .encrypt(jweSecret);

    let signed = await new jose.SignJWT({
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
    {
        key,
        value,
        description,
        expireAt,
    }: {
        key: string;
        value: jose.JWTPayload;
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
    let signedValue = await encryptAndSign(value, { jweSecret, jwtSecret });
    const { client } = await getGQLClient(context);
    const response = client.mutate({
        mutation: gql`
            mutation PutSecret($key: String!, $signedValue: String!, $description: String, $expireAt: Timestamp) {
                createSecret(key: $key, value: $signedValue, description: $description, expireAt: $expireAt) {
                    createdAt
                }
            }
        `,
        variables: {
            key,
            signedValue,
            description,
            expireAt,
        },
    });
    return response;
}
