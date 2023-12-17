import { ApolloServer, HTTPGraphQLResponse, HeaderMap } from "@apollo/server";
import { LambdaHandler, startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { RequestHandler, createRequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_create";
import {
    APIGatewayProxyEvent,
    APIGatewayProxyEventBase,
    APIGatewayProxyEventHeaders,
    APIGatewayProxyResult,
    Callback as LambdaCallback,
    Context as LambdaContext,
} from "aws-lambda";
import { Chalk } from "chalk";
import { DefaultContextBatched, RequestContext, RequestService, createDefaultContextBatched } from "./RequestContext";
import { User, UserTableIndex } from "./database/models/User";
import { BadInput } from "./errors";
import { createUserWithEmail } from "./functions/user";
import { UserPK } from "./pks/UserPK";
import { getServer } from "./server";

const chalk = new Chalk({ level: 3 });

export function printWarnings() {
    if (process.env.DEV_DOMAIN === "1") {
        console.warn(chalk.blue("Using remote DEV database us-east-1"));
    } else {
        console.warn(
            chalk.red(
                "DEV_DOMAIN is not set to 0. You are now connected to the production database! Using remote LIVE database us-east-1"
            )
        );
    }
}

export function normalizeHeaders(headers: APIGatewayProxyEventHeaders): { [header: string]: string } {
    const normalized: { [header: string]: string } = {};
    for (const [key, value] of Object.entries(headers ?? {})) {
        if (value) {
            normalized[key.toLowerCase()] = value;
        }
    }
    return normalized;
}

export async function getCurrentUser(
    batched: DefaultContextBatched,
    headers: { [header: string]: string },
    authorizer: AuthorizerContext | undefined
) {
    let currentUser = undefined;
    if (process.env.TRUST_X_USER_PK_HEADER == "1" || process.env.TRUST_X_USER_EMAIL_HEADER == "1") {
        if (process.env.TRUST_X_USER_PK_HEADER === "1") {
            const userPK = headers["x-user-pk"] || "";
            console.warn(chalk.yellow("TRUST_X_USER_PK_HEADER is enabled. Do not use this in production!"));
            if (userPK) {
                currentUser = (await batched.User.getOrNull(UserPK.parse(userPK))) ?? undefined;
            } else {
                console.warn(chalk.yellow("X-User-PK header is missing."));
            }
        }
        if (process.env.TRUST_X_USER_EMAIL_HEADER === "1") {
            const userEmail = headers["x-user-email"] || "";
            console.warn(chalk.yellow("TRUST_X_USER_EMAIL_HEADER is enabled. Do not use this in production!"));
            if (userEmail) {
                currentUser = await getOrCreateUserFromEmail(batched, userEmail);
            } else {
                console.warn(chalk.yellow("X-User-Email header is missing."));
            }
        }
    }
    if (authorizer?.["userEmail"]) {
        const userEmail = authorizer?.["userEmail"];
        currentUser = await getOrCreateUserFromEmail(batched, userEmail);
    } else if (authorizer?.["userPK"]) {
        const userPK = authorizer?.["userPK"];
        currentUser = await batched.User.get(UserPK.parse(userPK));
    }
    return currentUser;
}

export function getIsAdminUser(currentUser: User | undefined, authorizerContext: AuthorizerContext | undefined) {
    if (authorizerContext?.["isAdminUser"] === "true") {
        return true;
    }
    if (currentUser && UserPK.isAdmin(currentUser)) {
        return true;
    }
    return false;
}

export function getIsServiceRequest(domain: string, headers: { [header: string]: string }) {
    let isServiceRequest = false;
    const serviceName = headers["x-service-name"] as RequestService;
    // This domain is authenticated with AWS IAM. Only internal services
    // can access it. Therefore we can trust the X-Service-Name header. For
    // example, when the gateway service sends a graphql request, it
    // must include the X-Service-Name header.
    if (domain.startsWith("api.iam.")) {
        const valid: RequestService[] = ["payment", "gateway", "internal"];
        if (!valid.includes(serviceName)) {
            console.error(chalk.red("X-Service-Name header is missing."));
            throw new BadInput(`Invalid X-Service-Name header: ${serviceName}. Accepted values: ${valid.join(", ")}`);
        }
        isServiceRequest = true;
        // When the request is from a service to IAM, there's no user.
    } else if (process.env.TRUST_X_IS_SERVICE_REQUEST_HEADER === "1") {
        console.warn(chalk.yellow("TRUST_X_IS_SERVICE_REQUEST_HEADER is enabled. Do not use this in production!"));
        if (headers["x-is-service-request"] == "1") {
            isServiceRequest = true;
        }
    }
    return { serviceName, isServiceRequest };
}

export async function getOrCreateUserFromEmail(batched: DefaultContextBatched, email: string) {
    let currentUser = await batched.User.getOrNull(
        {
            email,
        },
        {
            using: UserTableIndex.IndexByEmailOnlyPk,
        }
    );
    if (currentUser === null) {
        currentUser = await createUserWithEmail(batched, email);
    }
    return currentUser;
}

export type AuthorizerContext = {
    userEmail: string | undefined;
    userPK: string | undefined;
    isAdminUser: string | undefined;
};

export type LambdaEvent = APIGatewayProxyEventBase<AuthorizerContext>;
export type LambdaResult = APIGatewayProxyResult;
export function addCors(event: APIGatewayProxyEvent, result: APIGatewayProxyResult): void {
    const origin = event.headers["Origin"] || event.headers["origin"];
    if (
        origin &&
        [
            /^http:\/\/yumbp16.local(:\\d+)?/,
            /^http:\/\/localhost(:\\d+)?/,
            /^https:\/\/fastchargeapi.com/,
            /^https:\/\/devfastchargeapi.com/,
        ].some((x) => x.test(origin))
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

let handlerInstance: LambdaHandler<RequestHandler<LambdaEvent, LambdaResult>> | undefined;
let serverInstance: ApolloServer<RequestContext> | undefined;

export async function callOrCreateHandler(
    event: LambdaEvent,
    context: LambdaContext,
    callback: LambdaCallback,
    options?: { stopServer?: boolean }
): Promise<LambdaResult> {
    const { stopServer } = options ?? {};
    if (!handlerInstance) {
        serverInstance = getServer();
        handlerInstance = startServerAndCreateLambdaHandler<RequestHandler<LambdaEvent, LambdaResult>, RequestContext>(
            serverInstance,
            createRequestHandler(
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
                        const { body } = event;
                        if (!body) {
                            return {} as never;
                        }
                        const bodyObj = JSON.parse(body) as unknown;
                        console.log(
                            chalk.blue(chalk.bold("GraphQL handler recieved LambdaEvent:")),
                            chalk.blue(JSON.stringify({ ...event, body: `<${typeof body}>` }, null, 2)),
                            chalk.blue(chalk.bold("\nPretty print body (JSON.parsed):")),
                            chalk.blue(JSON.stringify(bodyObj, null, 2))
                        );
                        return bodyObj as never; // Upstream expects wrong type
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
                    success(response: HTTPGraphQLResponse) {
                        const { status, body, headers } = response;
                        if (body.kind !== "complete") {
                            throw new Error("body.kind !== 'complete' is not implemented");
                        }
                        const bodyObj = JSON.parse(body.string) as { errors?: unknown };
                        const { errors } = bodyObj;
                        if (errors) {
                            console.error(
                                chalk.red(chalk.bold("GraphQL handler responds with errors:")),
                                chalk.red(JSON.stringify({ ...response, body: `<${typeof body}>` }, null, 2)),
                                chalk.red(chalk.bold("\nPretty print body:")),
                                chalk.red(JSON.stringify({ body: bodyObj }, null, 2))
                            );
                        } else {
                            console.log(
                                chalk.green(chalk.bold("GraphQL handler responds with data:")),
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
                async context({ event }: { event: LambdaEvent }): Promise<RequestContext> {
                    const batched = createDefaultContextBatched();
                    const headers: { [header: string]: string } = normalizeHeaders(event.headers ?? {});
                    const domain = event.requestContext.domainName || "";
                    const currentUser = await getCurrentUser(batched, headers, event.requestContext.authorizer);
                    const isAdminUser = getIsAdminUser(currentUser, event.requestContext.authorizer);
                    const { serviceName, isServiceRequest } = getIsServiceRequest(domain, headers);
                    const context = {
                        currentUser,
                        service: serviceName,
                        isServiceRequest,
                        batched,
                        isSQSMessage: false,
                        isAnonymousUser: currentUser == undefined,
                        isAdminUser,
                    };
                    return context;
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
