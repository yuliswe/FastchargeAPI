import { HeaderMap } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { RequestHandler, createRequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Chalk } from "chalk";
import { RequestContext, createDefaultContextBatched } from "./RequestContext";
import {
    LambdaEvent,
    LambdaResult,
    getCurrentUser,
    getIsAdminUser,
    getIsServiceRequest,
    normalizeHeaders,
} from "./lambdaHandlerUtils";
import { server } from "./server";

const chalk = new Chalk({ level: 3 });

function addCors(event: APIGatewayProxyEvent, result: APIGatewayProxyResult): void {
    let origin = event.headers["Origin"] || event.headers["origin"];
    if (
        origin &&
        [
            /^http:\/\/yumbp16.local(:\\d+)?/,
            /^http:\/\/localhost(:\\d+)?/,
            /^https:\/\/fastchargeapi.com/,
            /^https:\/\/devfastchargeapi.com/,
        ].some((x) => x.test(origin!))
    ) {
        result.headers = {
            ...(result.headers ?? {}),
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": origin,
            Vary: "Origin",
        };
    }
}

let handle = startServerAndCreateLambdaHandler<RequestHandler<LambdaEvent, LambdaResult>, RequestContext>(
    server,
    createRequestHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
        {
            parseHttpMethod(event) {
                return event.httpMethod;
            },
            parseHeaders(event) {
                const headerMap = new HeaderMap();
                for (const [key, value] of Object.entries(event.headers ?? {})) {
                    headerMap.set(key, value ?? "");
                }
                return headerMap;
            },
            parseBody(event, headers) {
                if (event.body) {
                    const contentType = headers.get("content-type");
                    const parsedBody = event.isBase64Encoded
                        ? Buffer.from(event.body, "base64").toString("utf8")
                        : event.body;
                    console.log(chalk.blue("Received: " + parsedBody));
                    if (contentType?.startsWith("application/json")) {
                        return JSON.parse(parsedBody);
                    }
                    if (contentType?.startsWith("text/plain")) {
                        return parsedBody;
                    }
                }
                return "";
            },
            parseQueryParams(event) {
                const params = new URLSearchParams();
                for (const [key, value] of Object.entries(event.multiValueQueryStringParameters ?? {})) {
                    for (const v of value ?? []) {
                        params.append(key, v);
                    }
                }
                return params.toString();
            },
        },
        {
            success({ body, headers, status }) {
                if (body.kind !== "complete") {
                    throw new Error("Only complete body type supported");
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
            error(error) {
                return {
                    statusCode: 400,
                    body: (error as Error).message,
                };
            },
        }
    ),
    {
        async context({ event }: { event: LambdaEvent }): Promise<RequestContext> {
            const batched = createDefaultContextBatched();
            const headers: { [header: string]: string } = normalizeHeaders(event.headers ?? {});
            const domain = event.requestContext.domainName || "";
            const currentUser = await getCurrentUser(batched, headers, event.requestContext.authorizer);
            const isAdminUser = getIsAdminUser(currentUser, event.requestContext.authorizer);
            const { serviceName, isServiceRequest } = getIsServiceRequest(domain, headers);
            return Promise.resolve({
                currentUser,
                service: serviceName,
                isServiceRequest,
                batched,
                isSQSMessage: false,
                isAnonymousUser: currentUser == undefined,
                isAdminUser,
            });
        },
    }
);

export const lambdaHandler = async (event: LambdaEvent, context: never, callback: never): Promise<LambdaResult> => {
    let response: LambdaResult;
    try {
        response = await handle(event, context, callback)!;
    } catch (error) {
        try {
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            // ignore
        }
        response = {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
    addCors(event, response);
    return response;
};
