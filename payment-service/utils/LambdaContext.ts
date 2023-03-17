import {
    APIGatewayProxyEventV2WithLambdaAuthorizer,
    APIGatewayProxyHandlerV2WithLambdaAuthorizer,
    Callback as LmabdaCallback,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export type AuthorizerContext = {
    userEmail: string | undefined;
    userPK: string | undefined;
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

export function getUserEmailFromEvent(event: LambdaEventV2): string {
    let email = event.requestContext.authorizer.lambda.userEmail;
    if (!email) {
        throw new Error("User email not found in authorizer context.");
    }
    return email;
}

export function getUserPKFromEvent(event: LambdaEventV2): string {
    let pk = event.requestContext.authorizer.lambda.userPK;
    if (!pk) {
        throw new Error("User pk not found in authorizer context.");
    }
    return pk;
}
