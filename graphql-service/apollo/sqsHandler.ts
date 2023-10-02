import {
    Callback as LambdaCallback,
    Context as LambdaContext,
    SQSBatchItemFailure,
    SQSBatchResponse,
    SQSEvent,
} from "aws-lambda";
import chalk from "chalk";
import { callOrCreateSQSHandler } from "./sqsHandlerUtils";
chalk.level = 3;

export const handler = async (
    event: SQSEvent,
    context: LambdaContext,
    callback: LambdaCallback
): Promise<SQSBatchResponse> => {
    const batchItemFailures: SQSBatchItemFailure[] = [];
    for (const record of event.Records) {
        try {
            await callOrCreateSQSHandler(record, context, callback);
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
