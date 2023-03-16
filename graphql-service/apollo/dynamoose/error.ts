import DynamooseError from "dynamoose-utils/dist/Error";
import { GraphQLFormattedError } from "graphql";
import { unwrapResolverError } from "@apollo/server/errors";
import { AlreadyExists, NotFound } from "../errors";
import { Chalk } from "chalk";

const chalk = new Chalk({ level: 3 });

export function handleError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
    let originalError = unwrapResolverError(error);
    console.error(chalk.red(JSON.stringify(originalError)));
    console.error(originalError);
    console.error(chalk.red(JSON.stringify(error)));
    console.error(error);
    for (let errtype of [DynamooseError.TypeMismatch, DynamooseError.ValidationError]) {
        if (originalError instanceof errtype) {
            return {
                ...formattedError,
                extensions: {
                    ...formattedError.extensions,
                    code: "BAD_USER_INPUT",
                },
                message: originalError.message,
            };
        }
    }
    if (originalError instanceof NotFound) {
        return {
            ...formattedError,
            extensions: { ...formattedError.extensions, code: "NOT_FOUND" },
            message: originalError.message,
        };
    }
    if (originalError instanceof AlreadyExists) {
        return {
            ...formattedError,
            extensions: {
                ...formattedError.extensions,
                code: "ALREADY_EXISTS",
            },
            message: originalError.message,
        };
    }
    return formattedError;
}
