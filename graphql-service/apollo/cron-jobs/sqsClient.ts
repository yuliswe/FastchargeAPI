import { InMemoryCache } from "@apollo/client/cache/inmemory/inMemoryCache";
import { ApolloClient } from "@apollo/client/core/ApolloClient";
import { HttpLink } from "@apollo/client/link/http/HttpLink";
import { v4 as uuidv4 } from "uuid";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { RequestInit, Response } from "node-fetch";

const cache = new InMemoryCache();

export enum SQSQueueUrl {
    BillingFifoQueue = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-billing-queue.fifo",
    UsageLogQueue = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-usage-log-queue",
}

const sqsClient = new SQSClient({ region: "us-east-1" });

export function sqsGQLClient({
    queueUrl,
    dedupId,
    groupId,
}: {
    queueUrl: SQSQueueUrl;
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
        },
        link: new HttpLink({
            fetch: async (uri: string, options: RequestInit) => {
                let body = options.body;
                if (queueUrl == SQSQueueUrl.BillingFifoQueue) {
                    groupId = "main";
                }
                await sqsClient.send(
                    new SendMessageCommand({
                        MessageBody: body?.toString(),
                        MessageGroupId: groupId,
                        QueueUrl: queueUrl,
                        MessageDeduplicationId: dedupId || uuidv4(),
                    })
                );
                return new Response(
                    JSON.stringify({
                        data: {},
                    })
                );
            },
        }),
    });
}
