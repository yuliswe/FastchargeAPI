import {
  ApolloClient,
  ApolloQueryResult,
  DefaultContext,
  FetchResult,
  InMemoryCache,
  MutationOptions,
  OperationVariables,
  QueryOptions,
  createHttpLink,
  from as linksFrom,
} from "@apollo/client/core";
import { ApolloError } from "@apollo/client/errors";
import { setContext } from "@apollo/client/link/context";
import chalk from "chalk";

import { RetryLink } from "@apollo/client/link/retry";
import { envVars, graphqlHost } from "src/env";
import {
  AlreadyExistsSimpleGQLError,
  BadUserInputSimpleGQLError,
  ImmutableResourceSimpleGQLError,
  NotFoundSimpleGQLError,
  PermissionDeniedSimpleGQLError,
  ResourceDeletedSimpleGQLError,
  SimplifiedGQLError,
  TooManyResourcesSimpleGQLError,
} from "src/simplifiedGQLErrors";
import { tiChecker } from "src/tiChecker";

async function loggingFetch(input: string, init?: RequestInit): Promise<Response> {
  const { body } = init ?? {};
  const { operationName, query, variables } = JSON.parse(body!.toString()) as {
    operationName?: string;
    query?: string;
    variables?: Record<string, unknown>;
  };

  const start = Date.now();
  console.log(chalk.blue(`${new Date().toISOString().slice(-13)} 📡 Sending ${operationName}`));
  console.log(query);
  console.log(`${chalk.blue("With variables:")} ${JSON.stringify(variables)}`);
  const response = await fetch(input, init);
  console.log(
    chalk.blue(
      `${new Date().toISOString().slice(-13)} 📡 Received ${operationName} response in ${Date.now() - start}ms`
    )
  );

  return {
    ...response,

    async text() {
      const start = Date.now();
      const result = await response.text();
      console.log(JSON.parse(result));
      console.log(
        chalk.blue(`${new Date().toISOString().slice(-13)} ⚙️ in ${Date.now() - start}ms (${result.length} bytes)`)
      );
      return result;
    },
  };
}

/**
 * Connects to the graphql server specified by uri.
 * @param param0
 * @returns
 */
export function getGQLClient(args?: { idToken?: string; userPK?: string; email?: string }) {
  const { idToken, userPK, email } = args ?? {};
  const httpLink = createHttpLink({
    uri: graphqlHost,
    fetch: envVars.LOG_REQUESTS ? loggingFetch : fetch,
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: idToken ?? "anonymous",
        "x-User-Email": email,
        "X-User-PK": userPK,
      } as Record<string, string | undefined>,
    };
  });

  const retryLink = new RetryLink({
    attempts: (count, operation, error) => {
      return Boolean(error) && count < 10;
    },
    delay: (count, operation, error) => {
      console.log(chalk.dim("Network error, retrying in 5 seconds."));
      return 5_000;
    },
  });

  const client = new ApolloClient({
    link: linksFrom([authLink, retryLink, httpLink]),
    cache: new InMemoryCache(),
  });

  const originalClientQuery = client.query.bind(client);
  const wrapperClientQuery = <T = any, TVariables extends OperationVariables = OperationVariables>(
    options: QueryOptions<TVariables, T>
  ): Promise<ApolloQueryResult<T>> => {
    // Our backend always returns a data field. If the query fails, it will
    // throw an ApolloError instead.
    return originalClientQuery(options).catch((e: ApolloError) => {
      throw mapApolloErrorToSimplifedGQLError(e);
    }) as Promise<ApolloQueryResult<T>> & { data: T };
  };

  const originalClientMutate = client.mutate.bind(client);
  const wrapperClientMutate = <
    TData = unknown,
    TVariables extends OperationVariables = OperationVariables,
    TContext extends Record<string, unknown> = DefaultContext
  >(
    options: MutationOptions<TData, TVariables, TContext>
  ): Promise<FetchResult<TData> & { data: TData }> => {
    // Our backend always returns a data field. If the mutation fails, it will
    // throw an ApolloError instead.
    return originalClientMutate(options).catch((e: ApolloError) => {
      throw mapApolloErrorToSimplifedGQLError(e);
    }) as Promise<FetchResult<TData> & { data: TData }>;
  };
  return { ...client, query: wrapperClientQuery, mutate: wrapperClientMutate };
}

export type GQLClient = ReturnType<typeof getGQLClient>;

function mapApolloErrorToSimplifedGQLError(originalApolloError: ApolloError): SimplifiedGQLError | ApolloError {
  const { graphQLErrors } = originalApolloError;
  if (graphQLErrors.length === 0) {
    return originalApolloError;
  }
  const { extensions } = graphQLErrors[0];
  switch (extensions.code) {
    case "ALREADY_EXISTS":
      return new AlreadyExistsSimpleGQLError({
        originalApolloError,
        extensions: tiChecker.AlreadyExistsSimpleGQLErrorExtensions.from(extensions),
      });
    case "NOT_FOUND":
      return new NotFoundSimpleGQLError({
        originalApolloError,
        extensions: tiChecker.NotFoundSimpleGQLErrorExtensions.from(extensions),
      });
    case "TOO_MANY_RESOURCES":
      return new TooManyResourcesSimpleGQLError({
        originalApolloError,
        extensions: tiChecker.TooManyResourcesSimpleGQLErrorExtensions.from(extensions),
      });
    case "PERMISSION_DENIED":
      return new PermissionDeniedSimpleGQLError({
        originalApolloError,
        extensions: tiChecker.PermissionDeniedSimpleGQLErrorExtensions.from(extensions),
      });
    case "IMMUTABLE_RESOURCE":
      return new ImmutableResourceSimpleGQLError({
        originalApolloError,
        extensions: tiChecker.ImmutableResourceSimpleGQLErrorExtensions.from(extensions),
      });
    case "BAD_USER_INPUT":
      // For user input error, the extensions should have a "field" key.
      if ("field" in extensions) {
        return new BadUserInputSimpleGQLError({
          originalApolloError,
          extensions: tiChecker.BadUserInputSimpleGQLErrorExtensions.from(extensions),
        });
      }
      // Currently if the graphql input is malformed, for example GraphQLError:
      // Variable \"$key\" of required type \"String!\" was not provided. You
      // will receive this error. This is not a user error, but a developer error.
      // In the future, we may want to use a different error type for this.
      return originalApolloError;
    case "RESOURCE_DELETED":
      return new ResourceDeletedSimpleGQLError({
        originalApolloError,
        extensions: tiChecker.ResourceDeletedSimpleGQLErrorExtensions.from(extensions),
      });
  }
  return originalApolloError;
}
