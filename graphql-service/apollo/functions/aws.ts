import { PK } from "@/database/utils";
import { BadInput, NotAccepted } from "@/errors";
import { SQSQueueName } from "@/sqsClient";
import AWS from "aws-sdk";
import chalk from "chalk";
import { RequestContext } from "../RequestContext";

export async function getParameterFromAWSSystemsManager(parameterName: string): Promise<string | undefined> {
    try {
        const params: AWS.SSM.GetParameterRequest = {
            Name: parameterName,
            WithDecryption: true,
        };

        const ssm = new AWS.SSM({ region: "us-east-1" });
        const data = await ssm.getParameter(params).promise();
        return data.Parameter?.Value;
    } catch (err) {
        console.error(`Failed to get parameter from cloud`, err);
    }
    return undefined;
}

/**
 * Deprecated. Use enforceCalledFromSQS instead.
 */
export function enforceCalledFromQueue(context: RequestContext, accountUser: PK) {
    if (!process.env.UNSAFE_BILLING) {
        if (!context.isSQSMessage) {
            console.error(
                chalk.red(
                    `This function must be called from an SQS message. If you are not running in production, you can set the UNSAFE_BILLING=1 environment variable to bypass this check.`
                )
            );
            throw new NotAccepted("This function must be called from SQS");
        }
        if (context.sqsMessageGroupId !== accountUser) {
            console.error(
                chalk.red(
                    `SQS group ID must be the receiver. Expected: ${accountUser}, current: ${
                        context.sqsMessageGroupId ?? "undefined"
                    }. If you are not running in production, you can set the UNSAFE_BILLING=1 environment variable to bypass this check.`
                )
            );
            throw new BadInput("SQS group ID must be the receiver.");
        }
    }
}

export function enforceCalledFromSQS({
    groupId,
    queueName,
    dedupId,
    context,
}: {
    groupId: string;
    queueName: SQSQueueName;
    dedupId: string;
    context: RequestContext;
}) {
    if (!context.isSQSMessage) {
        throw new NotAccepted("Must be called from SQS");
    }
    if (context.sqsQueueName != queueName) {
        throw new NotAccepted(`Must be called on SQS with QueueUrl = "${queueName}". Got: ${context.sqsQueueName}`);
    }
    if (context.sqsMessageDeduplicationId != dedupId) {
        throw new NotAccepted(
            `Must be called on SQS with MessageDeduplicationId = "${dedupId}". Got: ${context.sqsMessageDeduplicationId}`
        );
    }
    if (context.sqsMessageGroupId != groupId) {
        throw new NotAccepted(
            `Must be called on SQS with MessageGroupId = "${groupId}". Got: ${context.sqsMessageDeduplicationId}`
        );
    }
}
