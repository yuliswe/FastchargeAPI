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
      const response = await callOrCreateSQSHandler(record, context, callback);
      if (response.statusCode !== 200) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    } catch (error) {
      console.error(chalk.red(chalk.bold("Error uncaught by SQSHandler")), chalk.red(JSON.stringify(error, null, 2)));
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return {
    batchItemFailures,
  };
};
