import { AccountHistory } from "@/src/database/models/AccountHistory";
import { User } from "@/src/database/models/User";
import { AccountHistoryPK } from "@/src/pks/AccountHistoryPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import {
  baseRequestContext,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { v4 as uuidv4 } from "uuid";

const context = baseRequestContext;

let testOwnerUser: User;
let testOtherOwner: User;
let testAccountHistory: AccountHistory;
beforeAll(async () => {
  testOwnerUser = await getOrCreateTestUser(context, {
    email: `testOwnerUser_${uuidv4()}@gmail_mock.com`,
  });
  testOtherOwner = await getOrCreateTestUser(context, {
    email: `testOtherOwner_${uuidv4()}@gmail_mock.com`,
  });
  testAccountHistory = await context.batched.AccountHistory.createOverwrite({
    user: UserPK.stringify(testOwnerUser),
    sequentialId: 0,
    startingTime: 0,
    startingBalance: "0",
    closingTime: 0,
    closingBalance: "123",
  });
});

const getAccountHistory = graphql(`
  query TestGetAccountHistory($pk: ID!) {
    getAccountHistory(pk: $pk) {
      pk
      user {
        pk
      }
      startingTime
      startingBalance
      closingTime
      closingBalance
    }
  }
`);

describe("getAccountHistory", () => {
  test("Anyone can get their own account history", async () => {
    const promise = getTestGQLClient({ user: testOwnerUser }).query({
      query: getAccountHistory,
      variables: {
        pk: AccountHistoryPK.stringify(testAccountHistory),
      },
    });
    const { startingTime, closingTime, startingBalance, closingBalance } = testAccountHistory;
    await expect(promise).resolves.toMatchObject({
      data: {
        getAccountHistory: {
          pk: AccountHistoryPK.stringify(testAccountHistory),
          user: {
            pk: UserPK.stringify(testOwnerUser),
          },
          startingTime,
          closingTime,
          startingBalance,
          closingBalance,
        },
      },
    });
  });

  test("User can only get their own account history", async () => {
    const promise = getTestGQLClient({ user: testOtherOwner }).query({
      query: getAccountHistory,
      variables: {
        pk: AccountHistoryPK.stringify(testAccountHistory),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getAccountHistory.closingBalance",
      },
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getAccountHistory.closingTime",
      },
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getAccountHistory.pk",
      },
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getAccountHistory.startingBalance",
      },
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getAccountHistory.startingTime",
      },
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getAccountHistory.user",
      },
    ]);
  });
});
