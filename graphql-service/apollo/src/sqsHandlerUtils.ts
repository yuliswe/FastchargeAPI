import { RequestHandler, createRequestHandler } from "@/re-exports-aws-lambda";
import { RequestContext, RequestService, createDefaultContextBatched } from "@/src/RequestContext";
import { LambdaResult } from "@/src/lambdaHandlerUtils";
import { getServer } from "@/src/server";
import { SQSQueueName } from "@/src/sqsClient";
import { ApolloServer, HTTPGraphQLResponse, HeaderMap } from "@apollo/server";
import { LambdaHandler, startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { Callback as LambdaCallback, Context as LambdaContext, SQSRecord } from "aws-lambda";
import chalk from "chalk";

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
      createRequestHandler(
        {
          parseHttpMethod(record) {
            return "POST";
          },
          parseHeaders(record) {
            const headers = new HeaderMap();
            headers.set("content-type", "application/json");
            headers.set("origin", "devfastchargeapi.com");
            return headers;
          },
          parseBody(record, headers) {
            const { body } = record;
            const bodyObj = JSON.parse(body) as unknown;
            console.log(
              chalk.blue(chalk.bold("SQSHandler Received SQSRecord:")),
              chalk.blue(JSON.stringify({ ...record, headers, body: `<${typeof body}>` }, null, 2)),
              chalk.blue(chalk.bold("\nPretty print body (JSON.parsed):")),
              chalk.blue(JSON.stringify(bodyObj, null, 2))
            );
            return bodyObj as never;
          },
          parseQueryParams(record) {
            return "";
          },
        },
        {
          success(response: HTTPGraphQLResponse) {
            const { status, body, headers } = response;
            if (body.kind !== "complete") {
              throw new Error("body.kind !== 'complete' is not implemented");
            }
            const bodyObj = JSON.parse(body.string) as { errors?: unknown };
            const { errors } = bodyObj;
            if (errors) {
              console.error(
                chalk.red(chalk.bold("SQSHandler responds with errors:")),
                chalk.red(JSON.stringify({ ...response, body: `<${typeof body}>` }, null, 2)),
                chalk.red(chalk.bold("\nPretty print body:")),
                chalk.red(JSON.stringify({ body: bodyObj }, null, 2))
              );
            } else {
              console.log(
                chalk.green(chalk.bold("SQSHandler responds with data:")),
                chalk.green(JSON.stringify({ ...response, body: `<${typeof body}>` }, null, 2)),
                chalk.green(chalk.bold("\nPretty print body:")),
                chalk.green(JSON.stringify({ body: bodyObj }, null, 2))
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
          error(error: Error) {
            /* Non resolver error */
            throw error;
          },
        }
      ),
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
