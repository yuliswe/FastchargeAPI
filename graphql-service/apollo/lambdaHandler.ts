import { HeaderMap } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { LambdaRequest, LambdaResponse } from "@as-integrations/aws-lambda/dist/middleware";
import { RequestHandler, createRequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import {
    APIGatewayEventRequestContextV2,
    APIGatewayProxyEvent,
    APIGatewayProxyEventBase,
    APIGatewayProxyResult,
} from "aws-lambda";
import { Chalk } from "chalk";
import { RequestContext, RequestService, createDefaultContextBatched } from "./RequestContext";
import { GQLUserIndex } from "./__generated__/resolvers-types";
import { User } from "./dynamoose/models";
import { BadInput } from "./errors";
import { createUserWithEmail } from "./functions/user";
import { UserPK } from "./pks/UserPK";
import { server } from "./server";

export type LambdaEvent = APIGatewayProxyEventBase<APIGatewayEventRequestContextV2 | undefined>;
export type LambdaResult = APIGatewayProxyResult;
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

const batched = createDefaultContextBatched();

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
        async context({ event }: { event: APIGatewayProxyEvent }): Promise<RequestContext> {
            // let userEmail: string | undefined = undefined;
            // let userPK: string | undefined = undefined;
            let headers: { [header: string]: string } = {};
            for (const [key, value] of Object.entries(event.headers ?? {})) {
                if (value) {
                    headers[key.toLowerCase()] = value;
                }
            }
            let currentUser: User | undefined = undefined;
            let domain = event.requestContext.domainName || "";
            let serviceName: RequestService | undefined = undefined;
            let isServiceRequest = false;
            let isAdminUser = event.requestContext.authorizer?.["isAdminUser"] === "true";
            // This domain is authenticated with AWS IAM. Only internal services
            // can access it. Therefore we can trust the X-Service-Name header. For
            // example, when the gateway service sends a graphql request, it
            // must include the X-Service-Name header.
            if (domain === "api.iam.graphql.fastchargeapi.com") {
                serviceName = headers["x-service-name"] as RequestService;
                let valid: RequestService[] = ["payment", "gateway", "internal"];
                if (!valid.includes(serviceName)) {
                    console.error(chalk.red("X-Service-Name header is missing."));
                    throw new BadInput(
                        `Invalid X-Service-Name header: ${serviceName}. Accepted values: ${valid.join(", ")}`
                    );
                }
                isServiceRequest = true;
                // When the request is from a service to IAM, there's no user.
            } else if (process.env.TRUST_X_IS_SERVICE_REQUEST_HEADER === "1") {
                console.warn(
                    chalk.yellow("TRUST_X_IS_SERVICE_REQUEST_HEADER is enabled. Do not use this in production!")
                );
                if (headers["x-is-service-request"] === "true") {
                    isServiceRequest = true;
                }
            } else if (process.env.TRUST_X_USER_PK_HEADER === "1") {
                console.warn(chalk.yellow("TRUST_X_USER_PK_HEADER is enabled. Do not use this in production!"));
                let userPK = headers["x-user-pk"] || "";
                if (!userPK) {
                    console.error(chalk.red("X-User-PK header is missing."));
                    throw new BadInput(chalk.red("X-User-PK header is missing."));
                }
                currentUser = (await batched.User.getOrNull(UserPK.parse(userPK))) ?? undefined;
            } else if (process.env.TRUST_X_USER_EMAIL_HEADER === "1") {
                console.warn(chalk.yellow("TRUST_X_USER_EMAIL_HEADER is enabled. Do not use this in production!"));
                let userPK = headers["x-user-email"] || "";
                if (!userPK) {
                    console.error(chalk.red("X-User-Email header is missing."));
                    throw new BadInput(chalk.red("X-User-Email header is missing."));
                }
                currentUser = (await batched.User.getOrNull(UserPK.parse(userPK))) ?? undefined;
            } else if (event.requestContext.authorizer?.["isAnonymousUser"] === "true") {
                currentUser = undefined;
            } else if (event.requestContext.authorizer?.["userEmail"]) {
                let userEmail = event.requestContext.authorizer?.["userEmail"];
                currentUser = await getOrCreateUserFromEmail(userEmail);
            } else if (event.requestContext.authorizer?.["userPK"]) {
                let userPK = event.requestContext.authorizer?.["userPK"];
                currentUser = await batched.User.get(UserPK.parse(userPK));
            }
            return Promise.resolve({
                currentUser,
                service: serviceName,
                isServiceRequest,
                batched: createDefaultContextBatched(),
                isSQSMessage: false,
                isAnonymousUser: currentUser == undefined,
                isAdminUser,
            });
        },
        middleware: [corsMiddleware],
    }
);

async function getOrCreateUserFromEmail(email: string) {
    let currentUser = await batched.User.getOrNull(
        {
            email,
        },
        {
            using: GQLUserIndex.IndexByEmailOnlyPk,
        }
    );
    if (currentUser === null) {
        currentUser = await createUserWithEmail(batched, email);
    }
    return currentUser;
}

export const lambdaHandler = async (event: LambdaEvent, context: never, callback: never): Promise<LambdaResult> => {
    try {
        // console.log(chalk.blue(JSON.stringify(event)));
        return await handle(event, context, callback)!;
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
