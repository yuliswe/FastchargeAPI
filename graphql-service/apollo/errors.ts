import { unwrapResolverError } from "@apollo/server/errors";
import DynamooseError from "dynamoose-utils/dist/Error";
import { GraphQLFormattedError } from "graphql";

import { GraphQLError } from "graphql";

export enum GQLErrorCode {
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  TOO_MANY_RESOURCES = "TOO_MANY_RESOURCES",
  REQUIREMENT_NOT_SATISFIED = "REQUIREMENT_NOT_SATISFIED",
  BAD_USER_INPUT = "BAD_USER_INPUT",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  IMMUTABLE_RESOURCE = "IMMUTABLE_RESOURCE",
  RESOURCE_DELETED = "RESOURCE_DELETED",
  UNAUTHORIZED = "UNAUTHORIZED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  NOT_ACCEPTED = "NOT_ACCEPTED",
}

export class NotFound extends GraphQLError {
  constructor(public resource: string, public query: object) {
    super(`${resource} not found: ${JSON.stringify(query)}`, {
      extensions: { code: GQLErrorCode.NOT_FOUND, resource, query },
    });
  }
}

export class AlreadyExists extends GraphQLError {
  constructor(public resource: string, public query: object) {
    super(`${resource} already exists: ${JSON.stringify(query)}`, {
      extensions: { code: GQLErrorCode.ALREADY_EXISTS },
    });
  }
}

export class TooManyResources extends GraphQLError {
  constructor(public msg: string) {
    super(msg, {
      extensions: { code: GQLErrorCode.TOO_MANY_RESOURCES },
    });
  }
}

/**
 * Throw this error when user has to act on something before re-attempting the
 * request. For example, when user has to verify their email before logging in.
 * Or when user has to accept terms and conditions before performing an action.
 * If the user input is invalid, use BadInput instead.
 */
export class RequirementNotSatisfied extends GraphQLError {
  constructor(public msg: string) {
    super(msg, {
      extensions: { code: GQLErrorCode.REQUIREMENT_NOT_SATISFIED },
    });
  }
}

/**
 * Use this for validaton error on user input. For example, date format is
 * wrong. Or the user input is missing a required field.
 */
export class BadInput extends GraphQLError {
  constructor(public msg: string, public detailCode?: string) {
    super(msg, {
      extensions: { code: GQLErrorCode.BAD_USER_INPUT, detailCode },
    });
  }
}

export class Denied extends GraphQLError {
  constructor(msg?: string) {
    super(msg ?? `You do not have permission to perform this action.`, {
      extensions: { code: GQLErrorCode.PERMISSION_DENIED },
    });
  }
}

export class ImmutableResource extends GraphQLError {
  constructor(public resource: string, public msg?: string) {
    super(msg ?? `This resource can no longer be modified.`, {
      extensions: { code: GQLErrorCode.IMMUTABLE_RESOURCE, resource },
    });
  }
}

export class ResourceDeleted extends GraphQLError {
  constructor(public resource: string, public msg?: string) {
    super(msg ?? `This resource has been removed and will soon be deleted.`, {
      extensions: { code: GQLErrorCode.RESOURCE_DELETED, resource },
    });
  }
}

export class Unauthorized extends GraphQLError {
  constructor() {
    super(`You must log in to perform this action.`, {
      extensions: { code: GQLErrorCode.UNAUTHORIZED },
    });
  }
}

/**
 * Used when there's something wrong with the way the request is sent, usually
 * due to programming error. For example, when the request is sent to the HTTP
 * graphql endpoint when using SQS is required.
 */
export class NotAccepted extends GraphQLError {
  constructor(public msg: string) {
    super(msg ?? "The endpoint does not accept this request.", {
      extensions: { code: GQLErrorCode.NOT_ACCEPTED },
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
        extensions: { code: GQLErrorCode.INTERNAL_SERVER_ERROR },
      }
    );
  }
}

export class ValidationError extends GraphQLError {
  constructor(public field: string, public message: string, public current: unknown) {
    super(`Validation faild on "${field}": ${message}.\nGot: ${JSON.stringify(current)}`, {
      extensions: {
        code: GQLErrorCode.BAD_USER_INPUT,
        field,
      },
    });
  }
}

export function handleError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  // const silencedErrorCodes = process.env.SILENCE_ERRORS?.split(",").map((x) => x.trim()) ?? [];
  const originalError = unwrapResolverError(error); // The error thrown by the resolver
  if (originalError instanceof DynamooseError.TypeMismatch || originalError instanceof DynamooseError.ValidationError) {
    formattedError = {
      ...formattedError,
      extensions: {
        ...formattedError.extensions,
        code: GQLErrorCode.BAD_USER_INPUT,
      },
      message: originalError.message,
    };
  }
  // else if (originalError instanceof ValidationError) {
  //     formattedError = {
  //         extensions: {
  //             code: GQLErrorCode.BAD_USER_INPUT,
  //             field: originalError.field,
  //         },
  //         message: originalError.toString(),
  //     };
  // }
  // if (!silencedErrorCodes.includes(formattedError.extensions?.code as string)) {
  //     try {
  //         console.error(chalk.red("Response: " + JSON.stringify(formattedError, null, 2)) + " <~", originalError);
  //     } catch {
  //         console.error("Response:", formattedError, "<~", originalError);
  //     }
  // }
  return formattedError;
}
