import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { createDefaultContextBatched, RequestContext, server } from "./server";
import {
    APIGatewayEventRequestContext,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from "aws-lambda";
import { createAPIGatewayProxyEventRequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/APIGatewayProxyEventRequestHandler";
import { createRequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import { HeaderMap } from "@apollo/server";

export const lambdaHandler = async (event, context, callback) => {
    let handle = startServerAndCreateLambdaHandler(
        server,
        createRequestHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
            {
                parseHttpMethod(event) {
                    return event.httpMethod;
                },
                parseHeaders(event) {
                    const headerMap = new HeaderMap();
                    for (const [key, value] of Object.entries(
                        event.headers ?? {}
                    )) {
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
                    for (const [key, value] of Object.entries(
                        event.queryStringParameters ?? {}
                    )) {
                        params.append(key, value ?? "");
                    }
                    for (const [key, value] of Object.entries(
                        event.multiValueQueryStringParameters ?? {}
                    )) {
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
                    console.log("Body", body);
                    return {
                        statusCode: status ?? 200,
                        headers: {
                            ...Object.fromEntries(headers),
                            "content-length": Buffer.byteLength(
                                body.string
                            ).toString(),
                        },
                        body: body.string,
                    };
                },
                error(error) {
                    console.log("Error", error);

                    return {
                        statusCode: 400,
                        body: (error as Error).message,
                    };
                },
            }
        ),
        {
            context: ((lambda: {
                event: APIGatewayProxyEvent;
                context: APIGatewayEventRequestContext;
            }) => {
                // Note: You must not trust the header in production. This is just for
                // development.
                let userEmail: string;
                if (process.env.DEV == "1") {
                    userEmail = lambda.event.headers?.["x-user-email"] || "";
                } else {
                    userEmail = lambda.context.authorizer?.["userEmail"] || "";
                }
                return Promise.resolve({
                    currentUser: userEmail,
                    batched: createDefaultContextBatched(),
                });
            }) as any,
            middleware: [
                ((event) => {
                    return (result) => {
                        // result.headers["Access-Control-Allow-Origin"] = "*";
                        return result;
                    };
                }) as any,
            ],
        }
    );

    try {
        return await handle(event, context, callback);
    } catch (error) {
        console.log("Error:", error);
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};
