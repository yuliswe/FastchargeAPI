import { NotAccepted } from "@/errors";
import { SQSQueueName } from "@/sqsClient";
import AWS from "aws-sdk";
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

export function enforceCalledFromSQS(
    context: RequestContext,
    args: {
        groupId: string;
        queueName: SQSQueueName;
        dedupId?: string;
    }
) {
    const { groupId, queueName, dedupId } = args;
    if (!context.isSQSMessage) {
        throw new NotAccepted("Must be called from SQS");
    }
    if (context.sqsQueueName != queueName) {
        throw new NotAccepted(`Must be called on SQS with QueueUrl = "${queueName}". Got: ${context.sqsQueueName}`);
    }
    if (dedupId && context.sqsMessageDeduplicationId != dedupId) {
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
