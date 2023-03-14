import {
    APIGatewayProxyEventV2WithLambdaAuthorizer,
    APIGatewayProxyHandlerV2WithLambdaAuthorizer,
    Callback as LmabdaCallback,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export type AuthorizerContext = {
    userEmail: string | undefined;
};

export type LambdaEventV2 =
    APIGatewayProxyEventV2WithLambdaAuthorizer<AuthorizerContext>;

export type LambdaHandlerV2 = APIGatewayProxyHandlerV2WithLambdaAuthorizer<
    AuthorizerContext,
    APIGatewayProxyStructuredResultV2
>;

export type LambdaResultV2 = APIGatewayProxyStructuredResultV2;

export type LambdaCallbackV2 =
    LmabdaCallback<APIGatewayProxyStructuredResultV2>;

export function getAuthorizerContext(event: LambdaEventV2): AuthorizerContext {
    return event.requestContext.authorizer.lambda;
}
