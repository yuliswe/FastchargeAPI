import { RequestContext, createDefaultContextBatched } from "@/src/RequestContext";

import { AccountActivityReason, AccountActivityType } from "@/src/__generated__/resolvers-types";
import { User } from "@/src/database/models/User";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { getAdminUser, getGraphQLDataOrError, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
  batched: createDefaultContextBatched(),
  isServiceRequest: false,
  isSQSMessage: false,
  isAnonymousUser: false,
  isAdminUser: false,
};

let testUser: User;

beforeEach(async () => {
  testUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
});

const createAccountActivityMutation = graphql(`
  mutation TestCreateAccountActivity(
    $user: ID!
    $type: AccountActivityType!
    $reason: AccountActivityReason!
    $amount: NonNegativeDecimal!
    $description: String!
    $settleImmediately: Boolean!
    $settleAt: Timestamp
  ) {
    createAccountActivity(
      user: $user
      type: $type
      reason: $reason
      amount: $amount
      description: $description
      settleImmediately: $settleImmediately
      settleAt: $settleAt
    ) {
      pk
      user {
        pk
      }
      type
      reason
      amount
      description
      settleAt
    }
  }
`);

function accountActivityProps() {
  return {
    user: UserPK.stringify(testUser),
    type: AccountActivityType.Incoming,
    reason: AccountActivityReason.ApiMinMonthlyCharge,
    amount: "0",
    description: "test description",
    settleAt: Date.now(),
    settleImmediately: false,
  };
}

describe("createAccountActivity", () => {
  test("Admin user can create account activity", async () => {
    const promise = getTestGQLClient({ user: await getAdminUser(context) }).mutate({
      mutation: createAccountActivityMutation,
      variables: accountActivityProps(),
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        createAccountActivity: {
          __typename: "AccountActivity",
          pk: expect.any(String),
          amount: "0",
          description: "test description",
          reason: "api_min_monthly_charge",
          settleAt: expect.any(Number),
          type: "incoming",
          user: {
            __typename: "User",
            pk: UserPK.stringify(testUser),
          },
        },
      },
    });
  });

  test("Only admin can create account activity", async () => {
    const promise = getTestGQLClient({ user: testUser }).mutate({
      mutation: createAccountActivityMutation,
      variables: accountActivityProps(),
    });
    await expect(getGraphQLDataOrError(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "createAccountActivity",
      },
    ]);
  });

  test("If settles immediately, creates new account history", async () => {
    const oldAccountHistory = await context.batched.AccountHistory.many({
      user: UserPK.stringify(testUser),
    });
    expect(oldAccountHistory.length).toBe(0);
    await getTestGQLClient({ user: await getAdminUser(context) }).mutate({
      mutation: createAccountActivityMutation,
      variables: {
        ...accountActivityProps(),
        settleImmediately: true,
        amount: "100",
        type: AccountActivityType.Incoming,
      },
    });
    context.batched.AccountHistory.clearCache();
    const newAccountHistory = context.batched.AccountHistory.many({
      user: UserPK.stringify(testUser),
    });
    await expect(newAccountHistory).resolves.toMatchSnapshotExceptForProps([
      {
        user: UserPK.stringify(testUser),
        closingTime: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    ]);
  });
});
