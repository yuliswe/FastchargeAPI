import { User } from "@/src/database/models/User";
import { LambdaResult, callOrCreateHandler } from "@/src/lambdaHandlerUtils";
import { UserPK } from "@/src/pks/UserPK";
import { SQSQueueName, getUrlFromSQSQueueName } from "@/src/sqsClient";
import { callOrCreateSQSHandler } from "@/src/sqsHandlerUtils";
import { mockSQS } from "@/tests/test-utils/MockSQS";
import { exampleLambdaEvent } from "@/tests/test-utils/example-lambda-event";
import { InMemoryCache } from "@apollo/client/cache";
import { ApolloClient } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http";
import { SendMessageCommandInput } from "@aws-sdk/client-sqs";
import { Context as LambdaContext } from "aws-lambda";
import { RequestInit, Response } from "node-fetch";

const cache = new InMemoryCache();

export function getTestGQLClient(args: { user?: User; isServiceRequest?: boolean }) {
  const { user, isServiceRequest } = args;
  return new ApolloClient({
    cache,
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
      fetch: async (uri: string, options: RequestInit) => {
        const body = options.body?.toString() ?? "";
        const result = await callOrCreateHandler(
          {
            ...exampleLambdaEvent,
            body,
            headers: {
              ...exampleLambdaEvent.headers,
              "x-is-service-request": isServiceRequest ? "1" : undefined,
            },
            requestContext: {
              ...exampleLambdaEvent.requestContext,
              authorizer: {
                userEmail: user?.email,
                userPK: user && UserPK.stringify(user),
                isAdminUser: user?.isAdmin ? "true" : "false",
              },
            },
          },
          {} as LambdaContext,
          () => undefined,
          {
            stopServer: true,
          }
        );

        // The request may trigger a SQS message. Wait for it to be handled
        // before returning to the test case.
        await mockSQS.waitForQueuesToEmpty();

        return new Response(result.body, {
          status: result.statusCode,
          headers: Object.entries(result.headers ?? {}).map(([k, v]) => [k, v.toString()]),
        });
      },
    }),
  });
}

/**
 * Allows you to test the SQS handler by directly sending a GraphQL query to the
 * SQS handler, by adpoting the ApolloClient interface to the SQS handler.
 * Conviniently, also returns the response from the SQS handler containing the
 * GraphQL response, for testing purposes. Note that in production, the SQS
 * handler will not return data.
 */
export function getClientForDirectSQSCall({
  queueName,
  dedupId,
  groupId,
}: {
  queueName: SQSQueueName;
  dedupId?: string;
  groupId?: string;
}) {
  return new ApolloClient({
    cache,
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
      fetch: async (uri: string, options: RequestInit) => {
        const body = options.body;
        const input: SendMessageCommandInput = {
          MessageBody: body?.toString(),
          MessageGroupId: groupId,
          QueueUrl: getUrlFromSQSQueueName(queueName),
          MessageDeduplicationId: dedupId,
        };
        const result = await handSendMessageCommandData(input);

        /* The request may trigger a SQS message. Wait for it to be
                handled before returning to the test case. */
        if (mockSQS.shouldAutoWaitForQueuesToEmptyForSQSTestClient) {
          await mockSQS.waitForQueuesToEmpty();
        }

        return new Response(result.body, {
          status: result.statusCode,
          headers: Object.entries(result.headers ?? {}).map(([k, v]) => [k, v.toString()]),
        });
      },
    }),
  });
}

export async function handSendMessageCommandData(command: SendMessageCommandInput): Promise<LambdaResult> {
  const response = await callOrCreateSQSHandler(
    {
      body: command.MessageBody ?? "",
      messageId: "0",
      receiptHandle: "",
      attributes: {
        ApproximateReceiveCount: "0",
        SentTimestamp: "0",
        SenderId: "",
        ApproximateFirstReceiveTimestamp: "0",
        SequenceNumber: undefined,
        MessageGroupId: command.MessageGroupId,
        MessageDeduplicationId: command.MessageDeduplicationId,
        DeadLetterQueueSourceArn: undefined,
      },
      messageAttributes: {},
      md5OfBody: "",
      eventSource: "",
      eventSourceARN: `arn:aws:sqs:${command.QueueUrl?.split("/").at(-1) ?? ""}`,
      awsRegion: "",
    },
    {} as LambdaContext,
    (err, result) => {
      // nothing
    },
    { stopServer: true }
  );

  return response;
}
