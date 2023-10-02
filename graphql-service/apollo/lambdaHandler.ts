import { Callback as LambdaCallback, Context as LambdaContext } from "aws-lambda";
import { Chalk } from "chalk";
import { LambdaEvent, LambdaResult, addCors, callOrCreateHandler, printWarnings } from "./lambdaHandlerUtils";

export const chalk = new Chalk({ level: 3 });

export const lambdaHandler = async (
    event: LambdaEvent,
    context: LambdaContext,
    callback: LambdaCallback
): Promise<LambdaResult> => {
    printWarnings();
    let response: LambdaResult;
    try {
        response = await callOrCreateHandler(event, context, callback)!;
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
