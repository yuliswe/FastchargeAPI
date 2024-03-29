import { GQLUserIndex } from "__generated__/gql-operations";
import {
    APIGatewayProxyEventV2WithLambdaAuthorizer,
    APIGatewayProxyHandlerV2WithLambdaAuthorizer,
    APIGatewayProxyStructuredResultV2,
    Callback as LmabdaCallback,
} from "aws-lambda";
import { UserPK, createDefaultContextBatched } from "graphql-service";
import { User } from "graphql-service/dynamoose/models";

export type AuthorizerContext = {
    userPK?: string;
    userEmail?: string;
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

export async function getCurrentUserFromEvent(event: LambdaEventV2): Promise<User> {
    const userPK = event.requestContext.authorizer.lambda.userPK;
    const userEmail = event.requestContext.authorizer.lambda.userEmail;
    if (!userPK && !userEmail) {
        throw new Error("Neither userPK nor userEmail is present in the authorizer context");
    }
    const batched = createDefaultContextBatched();
    if (userPK) {
        return await batched.User.get(UserPK.parse(userPK));
    } else {
        return await batched.User.get({ email: userEmail }, { using: GQLUserIndex.IndexByEmailOnlyPk });
    }
}
