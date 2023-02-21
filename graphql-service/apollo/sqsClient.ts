import { InMemoryCache } from "@apollo/client/cache/inmemory/inMemoryCache";
import { ApolloClient } from "@apollo/client/core/ApolloClient";
import { HttpLink } from "@apollo/client/link/http/HttpLink";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from "uuid";
const sqsClient = new SQSClient({ region: "us-east-1" });

const cache = new InMemoryCache();

export function sqsGQLClient({ dedupId = undefined as string } = {}) {
    return new ApolloClient({
        // Provide required constructor fields
        cache: cache,
        link: new HttpLink({
            fetch: (uri, options) => {
                let body: string = options.body;
                let resp = sqsClient.send(
                    new SendMessageCommand({
                        MessageBody: body,
                        MessageGroupId: "graphql-service",
                        QueueUrl:
                            "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-ApolloServerQueue-iVEWVstsnedS.fifo",
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
