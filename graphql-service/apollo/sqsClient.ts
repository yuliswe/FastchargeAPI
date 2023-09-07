import { InMemoryCache } from "@apollo/client/cache";
import { ApolloClient } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http";
import { SQSClient, SendMessageCommand, SendMessageCommandInput } from "@aws-sdk/client-sqs";
import { RequestInit, Response } from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { mockSQS } from "./MockSQS";
import { awsAccountId } from "./runtime-config";

const cache = new InMemoryCache();

export const SQSQueueUrl = {
    BillingQueue: `https://sqs.us-east-1.amazonaws.com/${awsAccountId}/graphql-service-billing-queue.fifo`,
    UsageLogQueue: `https://sqs.us-east-1.amazonaws.com/${awsAccountId}/graphql-service-usage-log-queue.fifo`,
};

const sqsClient = new SQSClient({ region: "us-east-1" });

export function sqsGQLClient({ queueUrl, dedupId, groupId }: { queueUrl: string; dedupId?: string; groupId?: string }) {
    let errorWithCorrectStackTrace: Error | undefined;
    if (process.env.LOCAL_SQS) {
        errorWithCorrectStackTrace = new Error("Error in sqsGQLClient");
    }
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
                if (process.env.LOCAL_SQS === "1") {
                    const { handSendMessageCommandData } = await import("./sqsHandler");
                    try {
                        mockSQS.enqueue({ input, handler: handSendMessageCommandData });
                    } catch (error: any) {
                        throw new Error(`Error during MockSQS.enqueue:\n${error.stack}`, {
                            cause: errorWithCorrectStackTrace,
                        });
                    }
                } else {
                    await sqsClient.send(new SendMessageCommand(input));
                }
                return new Response(
                    JSON.stringify({
                        data: {},
                    })
                );
            },
        }),
    });
}
