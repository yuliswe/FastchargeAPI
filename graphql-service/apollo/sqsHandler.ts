import { HTTPGraphQLResponse, HeaderMap } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { RequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import chalk from "chalk";
import { RequestContext, RequestService, createDefaultContextBatched } from "./RequestContext";
import { server } from "./server";

chalk.level = 3;

let handle = startServerAndCreateLambdaHandler<RequestHandler<SQSRecord, void>, RequestContext>(
    server,
    {
        fromEvent(record) {
            let headers = new HeaderMap();
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
                    let body = response.body.string;
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
            let userEmail: string | undefined = undefined;
            let serviceName: RequestService = "internal";
            let isServiceRequest = true;
            return Promise.resolve({
                currentUser: userEmail,
                service: serviceName,
                isServiceRequest,
                isSQSMessage: true,
                batched: createDefaultContextBatched(),
                isAnonymousUser: userEmail == undefined,
                sqsMessageGroupId: event.attributes.MessageGroupId,
                sqsQueueName: event.eventSourceARN.split(":").at(-1),
            });
        },
    }
);

export const handler = async (event: SQSEvent, context: never, callback: never): Promise<SQSBatchResponse> => {
    let batchItemFailures: SQSBatchItemFailure[] = [];
    for (let record of event.Records) {
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
