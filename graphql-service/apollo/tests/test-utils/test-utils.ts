import { RequestContext, createDefaultContextBatched } from "@/src/RequestContext";
import { User, UserTableIndex } from "@/src/database/models/User";
import { getUserBalance } from "@/src/functions/account";
import { createUserWithEmail } from "@/src/functions/user";
import { UserPK } from "@/src/pks/UserPK";
import { createTestUser } from "@/tests/test-data/User";
import { ApolloError, GraphQLErrors } from "@apollo/client/errors";
import Decimal from "decimal.js-light";
import { v4 as uuid4 } from "uuid";

export const baseRequestContext: RequestContext = {
  batched: createDefaultContextBatched(),
  isServiceRequest: false,
  isSQSMessage: false,
  isAnonymousUser: false,
  isAdminUser: false,
};

export async function addMoneyForUser(
  context: RequestContext,
  args: {
    user: string;
    amount: string;
  }
): Promise<void> {
  const { user, amount } = args;
  const prevAccountHistory = (await context.batched.AccountHistory.many({ user }, { limit: 1, sort: "descending" })).at(
    0
  );
  await context.batched.AccountHistory.create({
    user,
    startingTime: prevAccountHistory?.closingTime ?? 0,
    closingTime: Date.now(),
    sequentialId: 1 + (prevAccountHistory?.sequentialId ?? 0),
    startingBalance: prevAccountHistory?.closingBalance ?? "0",
    closingBalance: new Decimal(prevAccountHistory?.closingBalance ?? "0").plus(amount).toString(),
  });
}

/**
 * @deprecated Use createTestUser instead.
 *
 * Create a user with the given email for testing purposes.
 * @returns Created user object.
 */
export async function getOrCreateTestUser(
  context: RequestContext,
  { email, ...additionalProps }: { email?: string } & Partial<User> = {}
) {
  if (!email) {
    email = `testuser_${uuid4()}@gmail_mock.com`;
  }
  let user = await context.batched.User.getOrNull({ email }, { using: UserTableIndex.IndexByEmailOnlyPk });
  if (user === null) {
    user = await createUserWithEmail(context.batched, email, additionalProps);
  }
  return user;
}

export async function getAdminUser(context: RequestContext): Promise<User> {
  const user = await context.batched.User.getOrNull(
    { email: "fastchargeapi@gmail.com" },
    { using: UserTableIndex.IndexByEmailOnlyPk }
  );
  if (user) {
    return user;
  }
  return createTestUser(context, {
    email: "fastchargeapi@gmail.com",
  });
}

type SimplifiedGraphQLError = { message: string; code: string; path: string };

export function sortGraphQLErrors<T extends Partial<SimplifiedGraphQLError>>(errors: T[]): T[] {
  const sortedErrors = errors;
  sortedErrors.sort((a, b) => {
    const diffByPath = (a.path || "").localeCompare(b.path || "");
    if (diffByPath !== 0) {
      return diffByPath;
    }
    const diffByCode = (a.code || "").localeCompare(b.code || "");
    if (diffByCode !== 0) {
      return diffByCode;
    }
    return (a.message || "").localeCompare(b.message || "");
  });
  return sortedErrors;
}

function simplifyGraphQLError(errors: GraphQLErrors) {
  const simpleErrors: SimplifiedGraphQLError[] = [];
  for (const e of errors) {
    simpleErrors.push({
      message: e.message,
      code: e.extensions.code as string,
      path: e.path?.map((x) => x.toString()).join(".") ?? "",
    });
  }
  return sortGraphQLErrors(simpleErrors);
}

/**
 * @deprecated Use getGraphQLDataOrError instead.
 */
export async function simplifyGraphQLPromiseRejection<T>(response: Promise<T>): Promise<T> {
  try {
    return await response;
  } catch (error) {
    if (error instanceof ApolloError) {
      throw simplifyGraphQLError(error.graphQLErrors);
    }
    throw error;
  }
}

export async function getGraphQLDataOrError<T extends { data?: unknown }>(response: Promise<T>): Promise<T["data"]> {
  const result = await simplifyGraphQLPromiseRejection(response);
  return result.data;
}

export async function getUserBalanceNoCache(context: RequestContext, user: User): Promise<string> {
  context.batched.AccountHistory.clearCache();
  return getUserBalance(context, UserPK.stringify(user));
}
