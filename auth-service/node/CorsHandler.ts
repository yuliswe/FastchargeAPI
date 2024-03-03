/**
 * You can use this file as a template for your Lambda function.
 */

import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import chalk from "chalk";
import type { LambdaEventV2, LambdaHandlerV2 } from "utils/LambdaContext";

async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
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
  event: LambdaEventV2
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
