import { ApolloServer, HTTPGraphQLResponse, HeaderMap } from "@apollo/server";
import { LambdaHandler, startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { RequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import { Callback as LambdaCallback, Context as LambdaContext, SQSRecord } from "aws-lambda";
import chalk from "chalk";
import { RequestContext, RequestService, createDefaultContextBatched } from "./RequestContext";
import { LambdaResult } from "./lambdaHandlerUtils";
import { getServer } from "./server";
import { SQSQueueName } from "./sqsClient";

function getSQSQueueNameFromArn(eventSourceARN: string): SQSQueueName {
    const name = eventSourceARN.split(":").at(-1) ?? "";
    if (Object.values(SQSQueueName).includes(name as SQSQueueName)) {
        return name as SQSQueueName;
    }
    throw new Error(`Unknown SQSQueueName: ${name}. Parsed from: ${eventSourceARN}`);
}

let handlerInstance: LambdaHandler<RequestHandler<SQSRecord, LambdaResult>> | undefined;
let serverInstance: ApolloServer<RequestContext> | undefined;
export async function callOrCreateSQSHandler(
    event: SQSRecord,
    context: LambdaContext,
    callback: LambdaCallback,
    options?: { stopServer?: boolean }
): Promise<LambdaResult> {
    const { stopServer } = options ?? {};
    if (!handlerInstance) {
        serverInstance = getServer();
        handlerInstance = startServerAndCreateLambdaHandler<RequestHandler<SQSRecord, LambdaResult>, RequestContext>(
            serverInstance,
            {
                fromEvent(record) {
                    const headers = new HeaderMap();
                    headers.set("Content-Type", "application/json");
                    try {
                        console.log(
                            chalk.blue("Recieved SQSRecord: " + JSON.stringify(JSON.parse(record.body), null, 2))
                        );
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
                toSuccessResult(response: HTTPGraphQLResponse) {
                    const { status, body, headers } = response;
                    if (body.kind !== "complete") {
                        throw new Error("body.kind !== 'complete' is not implemented");
                    }
                    const { errors } = JSON.parse(body.string) as { errors?: unknown };
                    if (errors) {
                        console.error(
                            chalk.red(
                                "Found graphqlErrors in the response to SQSGraphQLClient:\n" +
                                    JSON.stringify(errors, null, 2)
                            )
                        );
                    } else {
                        console.log(
                            chalk.green("Response (not visible to client): " + JSON.stringify(response, null, 2))
                        );
                    }
                    return {
                        statusCode: status ?? 200,
                        headers: {
                            ...Object.fromEntries(headers),
                            "content-length": Buffer.byteLength(body.string).toString(),
                        },
                        body: body.string,
                    };
                },
                toErrorResult(error: Error) {
                    return {
                        statusCode: 400,
                        body: error.message,
                    };
                },
            },
            {
                context({ event }: { event: SQSRecord }): Promise<RequestContext> {
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
                        sqsMessageDeduplicationId: event.attributes.MessageDeduplicationId,
                        sqsQueueName: getSQSQueueNameFromArn(event.eventSourceARN),
                    });
                },
            }
        );
    }
    try {
        return (await handlerInstance(event, context, callback)) as LambdaResult;
    } finally {
        if (stopServer) {
            await serverInstance?.stop();
            handlerInstance = undefined;
            serverInstance = undefined;
        }
    }
}
