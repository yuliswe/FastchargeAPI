import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { GraphQLSafeInt } from "graphql-scalars";

function checkNonNegativeDecimal(value: string) {
    let n = Number.parseFloat(value);
    if (Number.isNaN(n)) {
        throw new GraphQLError("Provided string is a malformed number.", {
            extensions: { code: "BAD_USER_INPUT" },
        });
    } else if (n <= 0) {
        throw new GraphQLError("Provided number is not positive or is too small.", {
            extensions: { code: "BAD_USER_INPUT" },
        });
    }
}

const NonNegativeDecimal = new GraphQLScalarType({
    name: "NonNegativeDecimal",

    description: "An arbitrary precision decimal type represented as a string",

    // Convert from server to client
    serialize(value: string): string {
        checkNonNegativeDecimal(value);
        return value;
    },

    // Convert from client to server
    parseValue(value: string): string {
        checkNonNegativeDecimal(value);
        return value;
    },

    // Convert hard-coded value in the .graphql schema
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            checkNonNegativeDecimal(ast.value);
            return ast.value;
        }
        return null;
    },
});

function checkURL(value: string, { forceHTTPS = true } = {}) {
    try {
        let url = new URL(value);
        if (!url.protocol.startsWith("http")) {
            throw new GraphQLError("Provided URL must use the HTTPS protocol.", {
                extensions: { code: "BAD_USER_INPUT" },
            });
        }
        if (forceHTTPS && url.protocol !== "https:") {
            throw new GraphQLError("Provided URL must use the HTTPS protocol.", {
                extensions: { code: "BAD_USER_INPUT" },
            });
        }
    } catch (e) {
        throw new GraphQLError("Provided string is not a valid URL. Reason: " + JSON.stringify(e), {
            extensions: { code: "BAD_USER_INPUT" },
        });
    }
}

const URLScalar = new GraphQLScalarType({
    name: "URL",

    description: "A URL type represented as a string, must start with https://",

    // Convert from server to client
    serialize(value: string): string {
        return value;
    },

    // Convert from client to server
    parseValue(value: string): string {
        checkURL(value);
        return value;
    },

    // Convert hard-coded value in the .graphql schema
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            checkURL(ast.value);
            return ast.value;
        }
        return null;
    },
});

export default {
    NonNegativeDecimal,
    Timestamp: new GraphQLScalarType({
        ...GraphQLSafeInt.toConfig(),
        name: "Timestamp",
    }),
    URL: URLScalar,
};
