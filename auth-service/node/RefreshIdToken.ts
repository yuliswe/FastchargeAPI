import { APIGatewayProxyStructuredResultV2, Context as LambdaContext } from "aws-lambda";
import { Chalk } from "chalk";
import { getParameterFromAWSSystemsManager } from "graphql-service";
import fetch from "node-fetch";
import { LambdaCallbackV2, LambdaEventV2, LambdaHandlerV2 } from "../utils/LambdaContext";

const chalk = new Chalk({ level: 3 });

type RefreshTokenResponse = {
    access_token: string;
    expires_in: string;
    token_type: string;
    refresh_token: string;
    id_token: string;
    user_id: string;
    project_id: string;
};

let API_KEY: string | undefined;
async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    let refreshToken: string;
    try {
        refreshToken = JSON.parse(event.body ?? "{}").refreshToken;
    } catch (error) {
        return {
            statusCode: 400,
            body: "Invalid Request: Body is not JSON",
        };
    }
    if (!refreshToken) {
        return {
            statusCode: 400,
            body: "Required in body: { refreshToken: string }",
        };
    }
    if (!API_KEY) {
        API_KEY = await getParameterFromAWSSystemsManager("auth.google_api_key.for_refresh_token");
    }
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
        method: "POST",
        body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });
    if (!response.ok) {
        return {
            statusCode: 400,
            body: "Invalid Request: Refresh token is invalid.",
        };
    }
    const data = (await response.json()) as RefreshTokenResponse;
    return {
        statusCode: 200,
        body: JSON.stringify({
            idToken: data.id_token,
            refreshToken: data.refresh_token,
        }),
    };
}

export const lambdaHandler: LambdaHandlerV2 = async (
    event: LambdaEventV2,
    context: LambdaContext,
    callback: LambdaCallbackV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
        console.log("event", chalk.blue(JSON.stringify(event)));
        return await handle(event);
    } catch (error) {
        try {
            console.error(error);
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            console.error(error);
        }
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};
