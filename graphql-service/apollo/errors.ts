import { unwrapResolverError } from "@apollo/server/errors";
import { Chalk } from "chalk";
import DynamooseError from "dynamoose-utils/dist/Error";
import { GraphQLFormattedError } from "graphql";

import { GraphQLError } from "graphql";

export class NotFound extends GraphQLError {
    constructor(public resource: string, public query: Object) {
        super(`${resource} not found: ${JSON.stringify(query)}`, {
            extensions: { code: "BAD_USER_INPUT", resource, query },
        });
    }
}

export class AlreadyExists extends GraphQLError {
    constructor(public resource: string, public key: string) {
        super(`${resource} already exists: ${JSON.stringify(key)}`, {
            extensions: { code: "BAD_USER_INPUT" },
        });
    }
}

export class TooManyResources extends GraphQLError {
    constructor(public msg: string) {
        super(msg, {
            extensions: { code: "TOO_MANY_RESOURCES" },
        });
    }
}

export class BadInput extends GraphQLError {
    constructor(public msg: string, public detailCode?: string) {
        super(msg, {
            extensions: { code: "BAD_USER_INPUT", detailCode },
        });
    }
}

export class Denied extends GraphQLError {
    constructor(msg?: string) {
        super(msg ?? `You do not have permission to perform this action.`, {
            extensions: { code: "PERMISSION_DENIED" },
        });
    }
}

export class ImmutableResource extends GraphQLError {
    constructor(public resource: string, public msg?: string) {
        super(msg ?? `This resource can no longer be modified.`, {
            extensions: { code: "IMMUTABLE_RESOURCE", resource },
        });
    }
}

export class Unauthorized extends GraphQLError {
    constructor() {
        super(`You must log in to perform this action.`, {
            extensions: { code: "UNAUTHORIZED" },
        });
    }
}

export class UpdateContainsPrimaryKey extends GraphQLError {
    constructor(public resource: string, public key: string, public newValues: object) {
        super(
            `New value of ${resource} cannot contain the primary key component ("${key}"): ${JSON.stringify(
                newValues
            )}, because it will actually create a new entry in the database. Consider deleting the old entry first.`,
            {
                extensions: { code: "INTERNAL_SERVER_ERROR" },
            }
        );
    }
}

const chalk = new Chalk({ level: 3 });

export function handleError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
    const originalError = unwrapResolverError(error);
    try {
        console.error(chalk.red(JSON.stringify(originalError)));
        console.error(originalError);
    } catch {
        console.error(originalError);
    }
    try {
        console.error(chalk.red(JSON.stringify(error)));
        console.error(error);
    } catch {
        console.error(error);
    }
    for (const errtype of [DynamooseError.TypeMismatch, DynamooseError.ValidationError]) {
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
