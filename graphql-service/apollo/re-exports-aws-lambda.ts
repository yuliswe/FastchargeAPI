/**
 * @module re-exports-AWS-Lambda
 * @description Re-export of @as-integrations/aws-lambda
 */
import { LambdaHandler, handlers, startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";

export type RequestHandler<EventType, ResultType> = handlers.RequestHandler<EventType, ResultType>;
const { createRequestHandler } = handlers;
export { LambdaHandler, createRequestHandler, startServerAndCreateLambdaHandler };
