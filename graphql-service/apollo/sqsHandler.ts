import { HTTPGraphQLResponse, HeaderMap } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { RequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import { SendMessageCommandInput } from "@aws-sdk/client-sqs";
import {
    Callback as LambdaCallback,
    Context as LambdaContext,
    SQSBatchItemFailure,
    SQSBatchResponse,
    SQSEvent,
    SQSRecord,
} from "aws-lambda";
import chalk from "chalk";
import { RequestContext, RequestService, createDefaultContextBatched } from "./RequestContext";
import { server } from "./server";
chalk.level = 3;

const handle = startServerAndCreateLambdaHandler<RequestHandler<SQSRecord, HTTPGraphQLResponse>, RequestContext>(
    server,
    {
        fromEvent(record) {
            const headers = new HeaderMap();
            headers.set("Content-Type", "application/json");
            try {
                console.log(chalk.blue("Recieved SQSRecord: " + JSON.stringify(JSON.parse(record.body), null, 2)));
            } catch (jsonError) {
                console.error(jsonError);
                console.log(record.body);
            }
            return {
                method: "POST",
                headers,
                search: "",
                body: JSON.parse(record.body),
            };
        },
        // If there's an error in the graphql query, the response will be 200
        // with errors in the body. However, since the SQS GraphQL client can't
        // receive the body, we always make it throw an error, so that the error
        // is logged.
        toSuccessResult(response: HTTPGraphQLResponse) {
            // I'm not sure why when the graphl query success, the status is undefined
            if (response.status === 200 || response.status == undefined) {
                if (response.body && response.body.kind === "complete") {
                    const body = JSON.parse(response.body.string) as { errors: any };
                    if (body.errors) {
                        console.error(
                            chalk.red(
                                "Found graphqlErrors in the response to SQSGraphQLClient:\n" +
                                    JSON.stringify(body.errors, null, 2)
                            )
                        );
                        throw new Error(
                            "Found graphqlErrors in the response to SQSGraphQLClient:\n" +
                                JSON.stringify(body.errors, null, 2),
                            {
                                cause: body,
                            }
                        );
                    }
                }
                console.log(chalk.green("Response (not visible to client): " + JSON.stringify(response, null, 2)));
                return response;
            } else {
                console.error(chalk.red("Non-200 response to SQSGraphQLClient: ", response));
                throw new Error("Non-200 response to SQSGraphQLClient:\n" + JSON.stringify(response, null, 2));
            }
        },
        toErrorResult(error: Error) {
            console.error(chalk.red(error.toString()));
            throw error;
        },
    },
    {
        context({ event }: { event: SQSRecord }) {
            const userEmail: string | undefined = undefined;
            const serviceName: RequestService = "internal";
            const isServiceRequest = true;
            return Promise.resolve({
                currentUser: userEmail,
                service: serviceName,
                isServiceRequest,
                isSQSMessage: true,
                batched: createDefaultContextBatched(),
                isAdminUser: false,
                isAnonymousUser: userEmail == undefined,
                sqsMessageGroupId: event.attributes.MessageGroupId,
                sqsQueueName: event.eventSourceARN.split(":").at(-1),
            });
        },
    }
);

export const handler = async (
    event: SQSEvent,
    context: LambdaContext,
    callback: LambdaCallback
): Promise<SQSBatchResponse> => {
    const batchItemFailures: SQSBatchItemFailure[] = [];
    for (const record of event.Records) {
        try {
            await handle(record, context, callback);
        } catch (error) {
            try {
                console.error(chalk.red(JSON.stringify(error, null, 2)));
            } catch (jsonError) {
                console.error(error);
                console.error(jsonError);
            }
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }
    return {
        batchItemFailures,
    };
};

export async function handSendMessageCommandData(command: SendMessageCommandInput): Promise<HTTPGraphQLResponse> {
    return (await handle(
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
            eventSourceARN: "",
            awsRegion: "",
        },
        {} as LambdaContext,
        (err, result) => {
            // nothing
        }
    )) as HTTPGraphQLResponse;
}
