import { HttpLink } from "@apollo/client/link/http/HttpLink";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from "uuid";
import {
    ApolloClient,
    createHttpLink,
    InMemoryCache,
    gql,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import firebase from "firebase/compat/app";
import { v4 as uuid4 } from "uuid";
import { AppContext } from "./AppContext";
import * as jose from "jose";

const sqsClient = new SQSClient({ region: "us-east-1" });

const cache = new InMemoryCache();

/**
 * Connects to the graphql server specified by uri.
 * @param param0
 * @returns
 */
export function gqlClient({ firebaseUser }: { firebaseUser: firebase.User }) {
    const httpLink = createHttpLink({
        uri: "https://api.graphql.fastchargeapi.com",
    });

    const authLink = setContext((_, { headers }) => {
        return {
            headers: {
                ...headers,
                authorization: firebaseUser.getIdToken(),
            },
        };
    });

    return new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
    });
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
        value: any;
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
    value = await encryptAndSign(value, {
        jweSecret,
        jwtSecret,
    });

    console.log("encrypted & signed:", value);
    const response = await gqlClient({
        firebaseUser: (await context.firebase.userPromise)!,
    }).mutate({
        mutation: gql`
            mutation PutSecret(
                $key: String!
                $value: String!
                $description: String
                $expireAt: Timestamp
            ) {
                createSecret(
                    key: $key
                    value: $value
                    description: $description
                    expireAt: $expireAt
                ) {
                    createdAt
                }
            }
        `,
        variables: {
            key,
            value,
            description,
            expireAt,
        },
    });
    return response;
}
