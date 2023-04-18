import {
    APIGatewayProxyEventV2WithLambdaAuthorizer,
    APIGatewayProxyHandlerV2WithLambdaAuthorizer,
    APIGatewayProxyStructuredResultV2,
    Callback as LmabdaCallback,
} from "aws-lambda";

export type AuthorizerContext = {
    userPK: string;
};

export type LambdaEventV2 = APIGatewayProxyEventV2WithLambdaAuthorizer<AuthorizerContext>;

export type LambdaHandlerV2 = APIGatewayProxyHandlerV2WithLambdaAuthorizer<
    AuthorizerContext,
    APIGatewayProxyStructuredResultV2
>;

export type LambdaResultV2 = APIGatewayProxyStructuredResultV2;

export type LambdaCallbackV2 = LmabdaCallback<APIGatewayProxyStructuredResultV2>;

export function getAuthorizerContext(event: LambdaEventV2): AuthorizerContext {
    return event.requestContext.authorizer.lambda;
}

export function getUserPKFromEvent(event: LambdaEventV2): string {
    let userPK = event.requestContext.authorizer.lambda.userPK;
    if (!userPK) {
        throw new Error("User PK not found in authorizer context.");
    }
    return userPK;
}
