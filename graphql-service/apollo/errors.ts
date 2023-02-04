import { GraphQLError } from "graphql";

export class NotFound extends GraphQLError {
    constructor(public resource: string, public key: string) {
        super(`${resource} not found: ${JSON.stringify(key)}`, {
            extensions: { code: "BAD_USER_INPUT" },
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

export class Denied extends GraphQLError {
    constructor() {
        super(`You do not have permission to perform this action.`, {
            extensions: { code: "PERMISSION_DENIED" },
        });
    }
}

export class UpdateContainsPrimaryKey extends GraphQLError {
    constructor(
        public resource: string,
        public key: string,
        public newValues: object
    ) {
        super(
            `New value of ${resource} cannot contain the primary key component ("${key}"): ${JSON.stringify(
                newValues
            )}.`,
            {
                extensions: { code: "INTERNAL_SERVER_ERROR" },
            }
        );
    }
}
