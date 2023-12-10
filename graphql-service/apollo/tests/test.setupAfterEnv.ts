import * as sqsClientModule from "@/sqsClient";
import { mockSQS } from "@/tests/MockSQS";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";
import { ApolloServer } from "@apollo/server";
import { afterEach, jest } from "@jest/globals";
import { RequestInit, Response } from "node-fetch";
import * as uuid from "uuid";
import { setUpTraceConsole } from "../console";
import { extendJest } from "./jest-extend";
import { handSendMessageCommandData } from "./testGQLClients";

extendJest();

const logLevel = Number.parseInt(process.env.LOG || "0");

function muteConsoleDuringTests() {
    const mute = (object: object, prop: string) => {
        Object.assign(object, { [prop]: () => ({}) });
    };

    if (logLevel == 0 || logLevel > 1) {
        mute(global.console, "log");
    }

    if (logLevel == 0 || logLevel > 2) {
        mute(global.console, "warn");
        mute(process, "emitWarning");
    }

    if (logLevel == 0 || logLevel > 3) {
        mute(global.console, "error");
    }

    /* Removed error log. It is fine because the lambda server has started in
the lambdaHandler.ts  */
    mute(ApolloServer.prototype, "logStartupError");
}

muteConsoleDuringTests();

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

    beforeEach(() => {
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
                    fetch: async (uri: string, { body }: RequestInit): Promise<Response> => {
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

                        /* The request may trigger a SQS message. Wait for it to
                        be handled before returning to the test case. */
                        await mockSQS.waitForQueuesToEmpty();

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
