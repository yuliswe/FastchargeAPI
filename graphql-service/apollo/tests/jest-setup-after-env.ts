import { ApolloError } from "@apollo/client";
import { expect } from "@jest/globals";
type ToMatchGraphQLErrorExpectation = { message?: string; code: string };

declare module "expect" {
    interface AsymmetricMatchers {
        toMatchGraphQLError(expected: ToMatchGraphQLErrorExpectation): void;
    }
    interface Matchers<R> {
        toMatchGraphQLError(expected: ToMatchGraphQLErrorExpectation): R;
    }
}

expect.extend({
    toMatchGraphQLError(actual: unknown, expected: ToMatchGraphQLErrorExpectation) {
        if (actual instanceof ApolloError) {
            const gqlError = actual.graphQLErrors.at(0);
            if (!gqlError) {
                return {
                    pass: false,
                    message: () => `Expected error to be present.`,
                };
            }
            if (expected.message !== undefined && !gqlError.message.includes(expected.message)) {
                return {
                    pass: false,
                    message: () =>
                        `Expected error message to include "${expected.message}", but got "${gqlError.message}".`,
                };
            }
            if (gqlError.extensions?.code !== expected.code) {
                return {
                    pass: false,
                    message: () =>
                        `Expected error code to be "${expected.code}", but got "${
                            gqlError.extensions?.code as string
                        }".`,
                };
            }
            return {
                pass: true,
                message: () => `Expected error to not match.`,
            };
        }
        return {
            pass: false,
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            message: () => `Not an ApolloError: ${actual}.`,
        };
    },
});
