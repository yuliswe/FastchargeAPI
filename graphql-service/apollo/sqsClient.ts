import { InMemoryCache } from "@apollo/client/cache";
import { ApolloClient } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { RequestInit, Response } from "node-fetch";
import { awsAccountId } from "./runtime-config";

const cache = new InMemoryCache();

export enum SQSQueueName {
  BillingQueue = "graphql-service-billing-queue.fifo",
  UsageLogQueue = "graphql-service-usage-log-queue.fifo",
}

export function getUrlFromSQSQueueName(queueName: SQSQueueName): string {
  return `https://sqs.us-east-1.amazonaws.com/${awsAccountId}/${queueName}`;
}

const sqsClient = new SQSClient({ region: "us-east-1" });

export function getSQSClient({
  queueName,
  dedupId,
  groupId,
}: {
  queueName: SQSQueueName;
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
        const command = new SendMessageCommand({
          MessageBody: body?.toString(),
          MessageGroupId: groupId,
          QueueUrl: getUrlFromSQSQueueName(queueName),
          MessageDeduplicationId: dedupId,
        });
        await sqsClient.send(command);
        return new Response(
          JSON.stringify({
            data: {},
          })
        );
      },
    }),
  });
}
