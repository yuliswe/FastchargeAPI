import { APIGatewayProxyEventBase, APIGatewayProxyEventHeaders, APIGatewayProxyResult } from "aws-lambda";
import { Chalk } from "chalk";
import { DefaultContextBatched, RequestService } from "./RequestContext";
import { GQLUserIndex } from "./__generated__/resolvers-types";
import { User } from "./dynamoose/models";
import { BadInput } from "./errors";
import { createUserWithEmail } from "./functions/user";
import { UserPK } from "./pks/UserPK";

const chalk = new Chalk({ level: 3 });

export function printWarnings() {
    if (process.env.DEV_DOMAIN === "0") {
        if (process.env.DISABLE_WARNINGS != "1") {
            console.warn(chalk.red("DEV_DOMAIN is not set to 0. You are now connected to the production database!"));
        }
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
            if (process.env.DISABLE_WARNINGS != "1") {
                console.warn(chalk.yellow("TRUST_X_USER_PK_HEADER is enabled. Do not use this in production!"));
            }
            if (userPK) {
                currentUser = (await batched.User.getOrNull(UserPK.parse(userPK))) ?? undefined;
            } else {
                if (process.env.DISABLE_WARNINGS != "1") {
                    console.warn(chalk.yellow("X-User-PK header is missing."));
                }
            }
        }
        if (process.env.TRUST_X_USER_EMAIL_HEADER === "1") {
            const userEmail = headers["x-user-email"] || "";
            if (process.env.DISABLE_WARNINGS != "1") {
                console.warn(chalk.yellow("TRUST_X_USER_EMAIL_HEADER is enabled. Do not use this in production!"));
            }
            if (userEmail) {
                currentUser = await getOrCreateUserFromEmail(batched, userEmail);
            } else {
                if (process.env.DISABLE_WARNINGS != "1") {
                    console.warn(chalk.yellow("X-User-Email header is missing."));
                }
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
    if (currentUser?.email == "fastchargeapi@gmail.com") {
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
        if (process.env.DISABLE_WARNINGS != "1") {
            console.warn(chalk.yellow("TRUST_X_IS_SERVICE_REQUEST_HEADER is enabled. Do not use this in production!"));
        }
        if (headers["x-is-service-request"] === "true") {
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
            using: GQLUserIndex.IndexByEmailOnlyPk,
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
export type LambdaEvent = APIGatewayProxyEventBase<AuthorizerContext> & { _disableLogRequest?: boolean };
export type LambdaResult = APIGatewayProxyResult;
