import { Context as LambdaContext, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Chalk } from "chalk";
import { LambdaCallbackV2, LambdaEventV2, LambdaHandlerV2 } from "../utils/LambdaContext";

const chalk = new Chalk({ level: 3 });

async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    let keyword: string | undefined;
    try {
        keyword = event.queryStringParameters?.keyword;
    } catch (error) {
        return {
            statusCode: 400,
            body: "Bad Request: Body is not valid JSON",
        };
    }
    if (!keyword) {
        return {
            statusCode: 400,
            body: "Bad Request: keyword is required in url query string",
        };
    }
    let results: [] = [];
    return Promise.resolve({
        statusCode: 200,
        body: JSON.stringify({
            results,
        }),
    });
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
