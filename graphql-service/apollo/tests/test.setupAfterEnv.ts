import { setUpTraceConsole } from "@/src/console";
import { createTypedormConnection } from "@/src/database/connection";
import * as sqsClientModule from "@/src/sqsClient";
import { extendJest } from "@/tests/jest-extend";
import { mockSQS } from "@/tests/test-utils/MockSQS";
import { handSendMessageCommandData } from "@/tests/test-utils/testGQLClients";
import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http";
import { ApolloServer } from "@apollo/server";
import { afterEach, jest } from "@jest/globals";
import { RequestInit, Response } from "node-fetch";

extendJest();

const logLevel = Number.parseInt(process.env.LOG || "0");

export function muteConsoleDuringTests() {
  // AWS library console logs right when the server starts, before jest can mock
  // the console. This is a workaround to mute the logs.
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
createTypedormConnection();

afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

if (process.env.TRACE_CONSOLE === "1") {
  setUpTraceConsole();
}

if (process.env.NO_LOCAL_SQS !== "1") {
  afterEach(async () => {
    // Helps us catch all remaining errors in the sqs opeartions.
    await mockSQS.waitForQueuesToEmpty();
    mockSQS.reset();
    mockSQS.shouldAutoWaitForQueuesToEmptyForSQSTestClient = true;
  });

  beforeEach(() => {
    jest.spyOn(sqsClientModule, "getSQSClient").mockImplementation((args) => {
      const { queueName, dedupId, groupId } = args;
      const errorWithCorrectStackTrace = new Error("Error in SQSClient");
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore // The ApolloClient type definition is wrong.
          fetch: async (uri: string, init?: RequestInit): Promise<Response> => {
            mockSQS.enqueue({
              input: {
                MessageBody: init?.body?.toString(),
                MessageGroupId: groupId,
                QueueUrl: sqsClientModule.getUrlFromSQSQueueName(queueName),
                MessageDeduplicationId: dedupId,
              },
              handler: async (message) => {
                const response = await handSendMessageCommandData(message);
                /* 
                  We want to explicitly fail the handler so that
                  waitForQueuesToEmpty() can reject, and make the error visible
                  during testing. The SQS GraphQL API is internal, and should
                  never return non 400 code. When that happens there must be a
                  bug. 
                */
                const { statusCode, body } = response;
                if (statusCode !== 200) {
                  throw new Error(`Response status code is ${statusCode}, expected 200. Response body: ${body}`);
                }
                const bodyObj = JSON.parse(body) as { errors?: unknown };
                const { errors } = bodyObj;
                if (errors) {
                  throw new Error(`Response body has errors: ${JSON.stringify(bodyObj)}`);
                }
              },
            });

            if (mockSQS.shouldAutoWaitForQueuesToEmptyForSQSTestClient) {
              try {
                await mockSQS.waitForQueuesToEmpty();
              } catch (error: unknown) {
                if (error instanceof Error) {
                  throw new Error(`Error during MockSQS.enqueue:\n${error.stack}`, {
                    cause: errorWithCorrectStackTrace,
                  });
                } else {
                  throw error;
                }
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
