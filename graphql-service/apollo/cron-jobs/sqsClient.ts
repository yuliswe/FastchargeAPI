import { InMemoryCache } from "@apollo/client/cache/inmemory/inMemoryCache";
import { ApolloClient } from "@apollo/client/core/ApolloClient";
import { HttpLink } from "@apollo/client/link/http/HttpLink";
import { v4 as uuidv4 } from "uuid";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

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
        // Provide required constructor fields
        cache: cache,
        link: new HttpLink({
            fetch: (uri: string, options: { body: string }) => {
                let body = options.body;
                if (queueUrl == SQSQueueUrl.BillingFifoQueue) {
                    groupId = "main";
                }
                let resp = sqsClient.send(
                    new SendMessageCommand({
                        MessageBody: body,
                        MessageGroupId: groupId,
                        QueueUrl: queueUrl,
                        MessageDeduplicationId: dedupId || uuidv4(),
                    })
                );
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
