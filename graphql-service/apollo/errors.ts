import { unwrapResolverError } from "@apollo/server/errors";
import DynamooseError from "dynamoose-utils/dist/Error";
import { GraphQLFormattedError } from "graphql";

import { Chalk } from "chalk";
import { GraphQLError } from "graphql";
import { ValidationError } from "./database/models";
const chalk = new Chalk({ level: 3 });

export class NotFound extends GraphQLError {
    constructor(public resource: string, public query: Object) {
        super(`${resource} not found: ${JSON.stringify(query)}`, {
            extensions: { code: "NOT_FOUND", resource, query },
        });
    }
}

export class AlreadyExists extends GraphQLError {
    constructor(public resource: string, public query: any) {
        super(`${resource} already exists: ${JSON.stringify(query)}`, {
            extensions: { code: "ALREADY_EXISTS" },
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

export class RequirementNotSatisfied extends GraphQLError {
    constructor(public msg: string) {
        super(msg, {
            extensions: { code: "REQUIREMENT_NOT_SATISFIED" },
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

export function handleError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
    const silencedErrorCodes = process.env.SILENCE_ERRORS?.split(",").map((x) => x.trim()) ?? [];
    const originalError = unwrapResolverError(error);
    if (
        originalError instanceof DynamooseError.TypeMismatch ||
        originalError instanceof DynamooseError.ValidationError
    ) {
        formattedError = {
            ...formattedError,
            extensions: {
                ...formattedError.extensions,
                code: "BAD_USER_INPUT",
            },
            message: originalError.message,
        };
    } else if (originalError instanceof ValidationError) {
        formattedError = {
            extensions: {
                code: "BAD_USER_INPUT",
            },
            message: originalError.toString(),
        };
    }
    if (!silencedErrorCodes.includes(formattedError.extensions?.code as string)) {
        try {
            console.error(chalk.red("Response: " + JSON.stringify(formattedError, null, 2)) + " <~", originalError);
        } catch {
            console.error("Response:", formattedError, "<~", originalError);
        }
    }
    return formattedError;
}
