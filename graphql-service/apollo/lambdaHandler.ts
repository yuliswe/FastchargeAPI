import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { server } from "./server";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createRequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import { HeaderMap } from "@apollo/server";
import { BadInput, Unauthorized } from "./errors";
import { RequestService, createDefaultContextBatched } from "./RequestContext";
import { Chalk } from "chalk";
import { LambdaRequest, LambdaResponse } from "@as-integrations/aws-lambda/dist/middleware";

const chalk = new Chalk({ level: 3 });

const corsMiddleware: LambdaRequest<APIGatewayProxyEvent, APIGatewayProxyResult> = async (
    event: APIGatewayProxyEvent
    // eslint-disable-next-line @typescript-eslint/require-await
): Promise<LambdaResponse<APIGatewayProxyResult>> => {
    let origin = event.headers.origin || "";
    let cors: { [key: string]: string } = {};
    if ([/^http:\/\/localhost:?\d*/, /^https:\/\/fastchargeapi.com/i].some((x) => x.test(origin))) {
        cors = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            Vary: "Origin",
        };
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    return async (result: APIGatewayProxyResult): Promise<void> => {
        result.headers = {
            ...result.headers,
            ...cors,
        };
    };
};

let handle = startServerAndCreateLambdaHandler(
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
                for (const [key, value] of Object.entries(event.queryStringParameters ?? {})) {
                    params.append(key, value ?? "");
                }
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
        context({ event }: { event: APIGatewayProxyEvent }) {
            let userEmail: string | undefined = undefined;
            let domain = event.requestContext.domainName || "";
            let serviceName: RequestService | undefined = undefined;
            let isServiceRequest = false;
            // This domain is authenticated with AWS IAM. Only internal services
            // can access it. Therefore we can trust the X-Service-Name header. For
            // example, when the gateway service sends a graphql request, it
            // must include the X-Service-Name header.
            if (domain === "api.iam.graphql.fastchargeapi.com") {
                serviceName = (event.headers["X-Service-Name"] || event.headers["x-service-name"]) as RequestService;
                let valid: RequestService[] = ["payment", "gateway", "internal"];
                if (!valid.includes(serviceName)) {
                    console.error(chalk.red("X-Service-Name header is missing."));
                    throw new BadInput(
                        `Invalid X-Service-Name header: ${serviceName}. Accepted values: ${valid.join(", ")}`
                    );
                }
                isServiceRequest = true;
            } else if (process.env.TRUST_X_USER_EMAIL_HEADER) {
                console.warn(chalk.yellow("TRUST_X_USER_EMAIL_HEADER is enabled. Do not use this in production!"));
                userEmail = event.headers["X-User-Email"] || "";
                if (!userEmail) {
                    console.error(chalk.red("X-User-Email header is missing."));
                    throw new BadInput(chalk.red("X-User-Email header is missing."));
                }
                isServiceRequest = false;
            } else {
                userEmail = event.requestContext.authorizer?.["userEmail"];
                if (!userEmail) {
                    console.error(chalk.red("Cannot determine userEmail."));
                    throw new Unauthorized();
                }
                isServiceRequest = false;
            }
            return Promise.resolve({
                currentUser: userEmail,
                service: serviceName,
                isServiceRequest,
                batched: createDefaultContextBatched(),
                isSQSMessage: false,
            });
        },
        middleware: [corsMiddleware],
    }
);

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: never, callback: never) => {
    try {
        return await handle(event, context, callback);
    } catch (error) {
        try {
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            // ignore
        }
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};
