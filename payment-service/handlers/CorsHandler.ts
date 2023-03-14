import {
    Context as LambdaContext,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { Chalk } from "chalk";
import {
    LambdaCallbackV2,
    LambdaEventV2,
    LambdaHandlerV2,
} from "../lib/LambdaContext";

const chalk = new Chalk({ level: 3 });

async function handle(
    event: LambdaEventV2,
    context: LambdaContext,
    callback: LambdaCallbackV2
): Promise<APIGatewayProxyStructuredResultV2> {
    if (event.requestContext.http.method === "OPTIONS") {
        return {
            statusCode: 200,
            body: JSON.stringify({}),
        };
    } else {
        return Promise.resolve({
            statusCode: 401,
            body: JSON.stringify({}),
        });
    }
}

export const lambdaHandler: LambdaHandlerV2 = async (
    event,
    context,
    callback
): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
        console.log("event", chalk.blue(JSON.stringify(event)));
        return await handle(event, context, callback);
    } catch (error) {
        try {
            console.error(error);
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            console.log(error);
        }
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};
