import { InMemoryCache } from "@apollo/client/cache";
import { ApolloClient } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http";
import { SendMessageCommandInput } from "@aws-sdk/client-sqs";
import { Headers, RequestInit, Response } from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { User } from "../database/models";
import { handle as serverLambdaHandler } from "../lambdaHandler";
import { LambdaResult } from "../lambdaHandlerUtils";
import { UserPK } from "../pks/UserPK";
import { exampleLambdaEvent } from "./example-lambda-event";

const cache = new InMemoryCache();

export function testGQLClient({ user }: { user: User }) {
    return new ApolloClient({
        cache: cache,
        // Disabling cache will prevent error because we can't return a response
        defaultOptions: {
            watchQuery: {
                fetchPolicy: "no-cache",
            },
            query: {
                fetchPolicy: "no-cache",
            },
            mutate: {
                fetchPolicy: "no-cache",
            },
        },
        link: new HttpLink({
            fetch: async (uri: string, options: RequestInit) => {
                const body = options.body?.toString() ?? "";
                const result = (await serverLambdaHandler(
                    {
                        ...exampleLambdaEvent,
                        body,
                        requestContext: {
                            ...exampleLambdaEvent.requestContext,
                            authorizer: {
                                userEmail: user.email,
                                userPK: UserPK.stringify(user),
                                isAdminUser: UserPK.isAdmin(user) ? "true" : "false",
                            },
                        },
                        _disableLogRequest: true,
                    },
                    {} as any,
                    (() => undefined) as any
                )) as LambdaResult;
                return new Response(result.body, {
                    status: result.statusCode,
                    headers: new Headers(Object.entries(result.headers ?? {}).map(([k, v]) => [k, v.toString()])),
                });
            },
        }),
    });
}

export function testSQSGQLClient({
    queueUrl,
    dedupId,
    groupId,
}: {
    queueUrl: string;
    dedupId?: string;
    groupId?: string;
}) {
    return new ApolloClient({
        cache: cache,
        // Disabling cache will prevent error because we can't return a response
        defaultOptions: {
            watchQuery: {
                fetchPolicy: "no-cache",
            },
            query: {
                fetchPolicy: "no-cache",
            },
            mutate: {
                fetchPolicy: "no-cache",
            },
        },
        link: new HttpLink({
            fetch: async (uri: string, options: RequestInit) => {
                const body = options.body;
                const input: SendMessageCommandInput = {
                    MessageBody: body?.toString(),
                    MessageGroupId: groupId,
                    QueueUrl: queueUrl,
                    MessageDeduplicationId: dedupId || uuidv4(),
                };
                const { handSendMessageCommandData } = await import("../sqsHandler");
                await handSendMessageCommandData(input);

                return new Response(
                    JSON.stringify({
                        data: {},
                    })
                );
            },
        }),
    });
}
