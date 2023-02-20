import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { server } from "./server";
import {
    SQSRecord,
    SQSEvent,
    SQSBatchResponse,
    SQSBatchItemFailure,
} from "aws-lambda";
import { RequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import { HTTPGraphQLResponse, HeaderMap } from "@apollo/server";
import { Chalk } from "chalk";
import {
    RequestContext,
    RequestService,
    createDefaultContextBatched,
} from "./RequestContext";

const chalk = new Chalk({ level: 3 });

let handle = startServerAndCreateLambdaHandler<
    RequestHandler<SQSRecord, void>,
    RequestContext
>(
    server,
    {
        fromEvent(record) {
            let headers = new HeaderMap();
            headers.set("Content-Type", "application/json");
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
                console.log("Success response: " + JSON.stringify(response));
                return response;
            } else {
                console.error(
                    chalk.red("Non-200 response: " + JSON.stringify(response))
                );
                throw new Error(
                    "Non-200 response: " + JSON.stringify(response)
                );
            }
        },
        toErrorResult(error) {
            console.error(chalk.red(error.toString()));
            throw error;
        },
    },
    {
        context({ event }: { event: SQSRecord }) {
            let userEmail: string;
            let serviceName: RequestService = "internal";
            let isServiceRequest = true;
            return Promise.resolve({
                currentUser: userEmail,
                service: serviceName,
                isServiceRequest,
                batched: createDefaultContextBatched(),
            });
        },
    }
);

export const handler = async (
    event: SQSEvent,
    context,
    callback
): Promise<SQSBatchResponse> => {
    let batchItemFailures: SQSBatchItemFailure[] = [];
    for (let record of event.Records) {
        try {
            await handle(record, context, callback);
        } catch (error) {
            console.error(chalk.red(error.toString()));
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }
    return {
        batchItemFailures,
    };
};
