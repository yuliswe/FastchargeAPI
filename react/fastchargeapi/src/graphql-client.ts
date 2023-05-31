import { ApolloClient, InMemoryCache, createHttpLink, gql } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { HttpLink } from "@apollo/client/link/http/HttpLink";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import * as jose from "jose";
import { v4 as uuidv4 } from "uuid";
import { AppContext } from "./AppContext";

// debug
const DEBUG_USE_LOCAL_GRAPHQL = process.env.REACT_APP_LOCAL_GRAPHQL === "1";

const sqsClient = new SQSClient({ region: "us-east-1" });
const cache = new InMemoryCache();

let graphql_url = "https://api.graphql.fastchargeapi.com";

if (DEBUG_USE_LOCAL_GRAPHQL) {
    graphql_url = "http://localhost:4000";
    console.warn("Using local graphql server", graphql_url);
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
        uri: graphql_url,
    });

    let user = await context.firebase.userPromise;
    if (!user) {
        throw new Error("getGQLClient: User Not logged in");
    }
    let idToken = await user.getIdToken(true);

    const authLink = setContext((_, { headers }) => {
        return {
            headers: {
                ...headers,
                authorization: idToken,
                "x-user-email": DEBUG_USE_LOCAL_GRAPHQL ? user?.email ?? undefined : undefined,
            },
        };
    });

    let client = new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
    });

    if (user.isAnonymous) {
        return { client };
    }

    let response = await client.query({
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

/**
 * Connects to the graphql server that is behind the SQS. By sending the request
 * to SQS, the request completes immediately, and will be asynchronously
 * processed by the graphql server. Furthermore, the request is deduplicated by
 * the dedupId, making it idempotent.
 *
 * @param param0
 * @returns
 */
export function sqsGQLClient({ dedupId }: { dedupId?: string } = {}) {
    return new ApolloClient({
        // Provide required constructor fields
        cache: cache,
        link: new HttpLink({
            fetch: (uri: RequestInfo | URL, options?: RequestInit) => {
                let body: string = options?.body?.toString() || "";
                let resp = sqsClient.send(
                    new SendMessageCommand({
                        MessageBody: body,
                        MessageGroupId: "graphql-service",
                        QueueUrl:
                            "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-ApolloServerQueue-iVEWVstsnedS.fifo",
                        MessageDeduplicationId: dedupId || uuidv4(),
                    })
                );
                return Promise.resolve({
                    ok: true,
                }) as unknown as Promise<Response>; // sqs is async, so we can't return a response
            },
        }),
        // Provide some optional constructor fields
        //   name: 'react-web-client',
        // version: "1.3",
        // queryDeduplication: false,
        // defaultOptions: {
        //     watchQuery: {
        //         fetchPolicy: "cache-and-network",
        //     },
        // },
    });
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
