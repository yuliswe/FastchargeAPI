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
} from "@apollo/client";
import { ApolloError } from "@apollo/client/errors";
import { setContext } from "@apollo/client/link/context";

import { graphqlHost } from "src/env";
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

/**
 * Connects to the graphql server specified by uri.
 * @param param0
 * @returns
 */
export function getGQLClient(args?: { idToken?: string; userPK?: string; email?: string }) {
  const { idToken, userPK, email } = args ?? {};
  const httpLink = createHttpLink({
    uri: graphqlHost,
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

  const client = new ApolloClient({
    link: linksFrom([authLink, httpLink]),
    cache: new InMemoryCache(),
  });

  const originalClientQuery = client.query.bind(client);
  const wrapperClientQuery = <T = any, TVariables extends OperationVariables = OperationVariables>(
    options: QueryOptions<TVariables, T>
  ): Promise<ApolloQueryResult<T>> => {
    return originalClientQuery(options).catch((e: ApolloError) => {
      throw mapApolloErrorToSimplifedGQLError(e);
    });
  };

  const originalClientMutate = client.mutate.bind(client);
  const wrapperClientMutate = <
    TData = unknown,
    TVariables extends OperationVariables = OperationVariables,
    TContext extends Record<string, unknown> = DefaultContext
  >(
    options: MutationOptions<TData, TVariables, TContext>
  ): Promise<FetchResult<TData>> => {
    return originalClientMutate(options).catch((e: ApolloError) => {
      throw mapApolloErrorToSimplifedGQLError(e);
    });
  };
  return { ...client, query: wrapperClientQuery, mutate: wrapperClientMutate };
}

function mapApolloErrorToSimplifedGQLError(originalApolloError: ApolloError): SimplifiedGQLError | ApolloError {
  const { graphQLErrors } = originalApolloError;
  const firstError = graphQLErrors?.[0];
  if (!firstError) {
    return originalApolloError;
  }
  const { extensions } = firstError;
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
