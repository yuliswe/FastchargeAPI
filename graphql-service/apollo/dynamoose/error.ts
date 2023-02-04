import DynamooseError from "dynamoose-utils/dist/Error"
import { GraphQLFormattedError } from "graphql"
import { unwrapResolverError } from '@apollo/server/errors';
import { AlreadyExists, NotFound } from "../errors";

export function formatDynamooseError(formattedError: GraphQLFormattedError, error: any): GraphQLFormattedError {
    let originalError = unwrapResolverError(error)
    for (let errtype of [DynamooseError.TypeMismatch, DynamooseError.ValidationError]) {
        if (originalError instanceof errtype) {
            return { ...formattedError, extensions: { ...formattedError.extensions, code: "BAD_USER_INPUT" }, "message": originalError.message }
        }
    }
    if (originalError instanceof NotFound) {
        return { ...formattedError, extensions: { ...formattedError.extensions, code: "NOT_FOUND" }, "message": originalError.message }
    }
    if (originalError instanceof AlreadyExists) {
        return { ...formattedError, extensions: { ...formattedError.extensions, code: "ALREADY_EXISTS" }, "message": originalError.message }
    }
    return formattedError;
}
