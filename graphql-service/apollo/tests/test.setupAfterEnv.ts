import * as sqsClientModule from "@/sqsClient";
import { handSendMessageCommandData } from "@/sqsHandlerUtils";
import { mockSQS } from "@/tests/MockSQS";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";
import { ApolloServer } from "@apollo/server";
import { afterEach, beforeAll, jest } from "@jest/globals";
import { RequestInit, Response } from "node-fetch";
import * as uuid from "uuid";
import { setUpTraceConsole } from "../console";

const logLevel = Number.parseInt(process.env.LOG || "0");

if (logLevel == 0 || logLevel > 1) {
    jest.spyOn(global.console, "log").mockImplementation(() => jest.fn());
}

if (logLevel == 0 || logLevel > 2) {
    jest.spyOn(global.console, "warn").mockImplementation(() => jest.fn());
}

if (logLevel == 0 || logLevel > 3) {
    jest.spyOn(global.console, "error").mockImplementation(() => jest.fn());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.spyOn(ApolloServer.prototype as any, "logStartupError").mockImplementation(() => {
    /* Removed error log. It is fine because the lambda server has started in
    the lambdaHandler.ts  */
});

if (process.env.TRACE_CONSOLE === "1") {
    setUpTraceConsole();
}

if (process.env.LOCAL_SQS === "1") {
    afterEach(async () => {
        // Helps us catch all remaining errors in the sqs opeartions.
        await mockSQS.waitForQueuesToEmpty();
        mockSQS.reset();
    });

    beforeAll(() => {
        jest.spyOn(sqsClientModule, "sqsGQLClient").mockImplementation(({ queueName, dedupId, groupId }) => {
            const errorWithCorrectStackTrace = new Error("Error in sqsGQLClient");
            return new ApolloClient({
                cache: new InMemoryCache(),
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
                    fetch: (uri: string, { body }: RequestInit): Promise<Response> => {
                        try {
                            mockSQS.enqueue({
                                input: {
                                    MessageBody: body?.toString(),
                                    MessageGroupId: groupId,
                                    QueueUrl: sqsClientModule.getUrlFromSQSQueueName(queueName),
                                    MessageDeduplicationId: dedupId || uuid.v4(),
                                },
                                handler: handSendMessageCommandData,
                            });
                        } catch (error: unknown) {
                            if (error instanceof Error) {
                                throw new Error(`Error during MockSQS.enqueue:\n${error.stack}`, {
                                    cause: errorWithCorrectStackTrace,
                                });
                            } else {
                                throw error;
                            }
                        }
                        return Promise.resolve(
                            new Response(
                                JSON.stringify({
                                    data: {},
                                })
                            )
                        );
                    },
                }),
            });
        });
    });
}
