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

const handle = startServerAndCreateLambdaHandler<RequestHandler<SQSRecord, void>, RequestContext>(
    server,
    {
        fromEvent(record) {
            const headers = new HeaderMap();
            headers.set("Content-Type", "application/json");
            console.log(chalk.blue("Recieved SQSRecord: " + record.body));
            return {
                method: "POST",
                headers,
                search: "",
                body: JSON.parse(record.body),
            };
        },
        toSuccessResult(response: HTTPGraphQLResponse) {
            if (response.status === 200 || response.status == undefined) {
                // I'm not sure why when the graphl query success, the status is undefined
                if (response.body && response.body.kind === "complete") {
                    const body = response.body.string;
                    if (JSON.parse(body).errors) {
                        console.error(chalk.red("Error response: " + body));
                        throw new Error("Error response: " + body);
                    } else {
                        return response;
                    }
                } else {
                    return response;
                }
            } else {
                console.error(chalk.red("Non-200 response: " + JSON.stringify(response)));
                throw new Error("Non-200 response: " + JSON.stringify(response));
            }
        },
        toErrorResult(error: object) {
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
                console.error(chalk.red(JSON.stringify(error)));
            } catch (jsonError) {
                // ignore
            }
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }
    return {
        batchItemFailures,
    };
};

export async function handSendMessageCommandData(command: SendMessageCommandInput) {
    return await handle(
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
        {} as any,
        (err, result) => {
            // nothing
        }
    );
}
