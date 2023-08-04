import { InMemoryCache } from "@apollo/client/cache";
import { ApolloClient } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http";
import { RequestInit, Response } from "node-fetch";
import { User } from "../dynamoose/models";
import { handle } from "../lambdaHandler";
import { LambdaResult } from "../lambdaHandlerUtils";
import { UserPK } from "../pks/UserPK";
import { exampleLambdaEvent } from "./example-lambda-event";

const cache = new InMemoryCache();

export function testGQLClient({ user }: { user: User }) {
    return new ApolloClient({
        cache: cache,
        // Disabling cache will prevent error because we can't return a response
        defaultOptions: {
            watchQuery: {
                fetchPolicy: "no-cache",
            },
            query: {
                fetchPolicy: "no-cache",
            },
            mutate: {
                fetchPolicy: "no-cache",
            },
        },
        link: new HttpLink({
            fetch: async (uri: string, options: RequestInit) => {
                const body = options.body?.toString() ?? "";
                const result = (await handle(
                    {
                        ...exampleLambdaEvent,
                        body,
                        requestContext: {
                            ...exampleLambdaEvent.requestContext,
                            authorizer: {
                                userEmail: user.email,
                                userPK: UserPK.stringify(user),
                                isAdminUser: UserPK.isAdmin(user) ? "true" : "false",
                            },
                        },
                        _disableLogRequest: true,
                    },
                    {} as any,
                    (() => undefined) as any
                )) as LambdaResult;
                return new Response(result.body);
            },
        }),
    });
}
