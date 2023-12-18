import { AccountActivityStatus, AccountActivityType } from "@/__generated__/resolvers-types";
import { User } from "@/database/models/User";
import { AccountActivityPK } from "@/pks/AccountActivityPK";
import { UserPK } from "@/pks/UserPK";
import { SQSQueueName } from "@/sqsClient";
import { createTestAccountActivity } from "@/tests/test-utils/models/AccountActivity";
import { createTestUser } from "@/tests/test-utils/models/User";
import {
  baseRequestContext as context,
  getUserBalanceNoCache,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getClientForDirectSQSCall, getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";

let testUser: User;

const settleAccountActivitiesForUserMutation = graphql(`
  mutation TestSettleAccountActivitiesForUser($user: ID!) {
    _sqsSettleAccountActivitiesForUser(user: $user)
  }
`);

describe("_sqsSettleAccountActivitiesForUser", () => {
  beforeEach(async () => {
    testUser = await createTestUser(context);
  });

  test("Can only be called from SQS", async () => {
    const promise = getTestGQLClient({
      isServiceRequest: true,
    }).mutate({
      mutation: settleAccountActivitiesForUserMutation,
      variables: {
        user: UserPK.stringify(testUser),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: "Must be called from SQS",
        path: "_sqsSettleAccountActivitiesForUser",
      },
    ]);
  });

  test("Must be called with a correct group id", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
    }).mutate({
      mutation: settleAccountActivitiesForUserMutation,
      variables: {
        user: UserPK.stringify(testUser),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: expect.stringContaining("Must be called on SQS with MessageGroupId =") as string,
        path: "_sqsSettleAccountActivitiesForUser",
      },
    ]);
  });

  test("Settles account activity when called", async () => {
    let accountactivity = await createTestAccountActivity(context, {
      user: UserPK.stringify(testUser),
      status: AccountActivityStatus.Pending,
    });
    await getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testUser),
    }).mutate({
      mutation: settleAccountActivitiesForUserMutation,
      variables: {
        user: UserPK.stringify(testUser),
      },
    });
    accountactivity = await context.batched.AccountActivity.get(AccountActivityPK.extract(accountactivity));
    expect(accountactivity).toMatchObject({
      status: AccountActivityStatus.Settled,
    });
  });

  test("Increases AccountHistory balance when called on an incoming activity", async () => {
    await createTestAccountActivity(context, {
      user: UserPK.stringify(testUser),
      status: AccountActivityStatus.Pending,
      amount: "1",
      type: AccountActivityType.Incoming,
      settleAt: Date.now() - 1000,
    });
    // User initialliy has no AccountHistory
    let accounthistory = await context.batched.AccountHistory.getOrNull({
      user: UserPK.stringify(testUser),
    });
    expect(accounthistory).toBeNull();
    let userBalance = await getUserBalanceNoCache(context, testUser);
    expect(userBalance).toEqual("0");
    await getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testUser),
    }).mutate({
      mutation: settleAccountActivitiesForUserMutation,
      variables: {
        user: UserPK.stringify(testUser),
      },
    });
    context.batched.AccountHistory.clearCache();
    accounthistory = await context.batched.AccountHistory.getOrNull({
      user: UserPK.stringify(testUser),
    });
    expect(accounthistory).toMatchObject({
      closingBalance: "1",
      sequentialId: 0,
      startingBalance: "0",
      startingTime: 0,
      user: UserPK.stringify(testUser),
    });
    userBalance = await getUserBalanceNoCache(context, testUser);
    expect(userBalance).toEqual("1");
  });

  test("Decreases AccountHistory balance when called on an outgoing activity", async () => {
    await createTestAccountActivity(context, {
      user: UserPK.stringify(testUser),
      status: AccountActivityStatus.Pending,
      amount: "1",
      type: AccountActivityType.Outgoing,
      settleAt: Date.now() - 1000,
    });
    // User initialliy has no AccountHistory
    let accounthistory = await context.batched.AccountHistory.getOrNull({
      user: UserPK.stringify(testUser),
    });
    expect(accounthistory).toBeNull();
    let userBalance = await getUserBalanceNoCache(context, testUser);
    expect(userBalance).toEqual("0");
    await getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testUser),
    }).mutate({
      mutation: settleAccountActivitiesForUserMutation,
      variables: {
        user: UserPK.stringify(testUser),
      },
    });
    context.batched.AccountHistory.clearCache();
    accounthistory = await context.batched.AccountHistory.getOrNull({
      user: UserPK.stringify(testUser),
    });
    expect(accounthistory).toMatchObject({
      closingBalance: "-1",
      sequentialId: 0,
      startingBalance: "0",
      startingTime: 0,
      user: UserPK.stringify(testUser),
    });
    userBalance = await getUserBalanceNoCache(context, testUser);
    expect(userBalance).toEqual("-1");
  });

  test("Called on multiple activities should result in the current balance", async () => {
    await createTestAccountActivity(context, {
      user: UserPK.stringify(testUser),
      status: AccountActivityStatus.Pending,
      amount: "1",
      type: AccountActivityType.Incoming,
      settleAt: Date.now() - 1000,
    });
    await createTestAccountActivity(context, {
      user: UserPK.stringify(testUser),
      status: AccountActivityStatus.Pending,
      amount: "2",
      type: AccountActivityType.Outgoing,
      settleAt: Date.now() - 1000,
    });
    // User initialliy has no AccountHistory
    let accounthistory = await context.batched.AccountHistory.getOrNull({
      user: UserPK.stringify(testUser),
    });
    expect(accounthistory).toBeNull();
    let userBalance = await getUserBalanceNoCache(context, testUser);
    expect(userBalance).toEqual("0");
    await getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testUser),
    }).mutate({
      mutation: settleAccountActivitiesForUserMutation,
      variables: {
        user: UserPK.stringify(testUser),
      },
    });
    context.batched.AccountHistory.clearCache();
    accounthistory = await context.batched.AccountHistory.getOrNull({
      user: UserPK.stringify(testUser),
    });
    expect(accounthistory).toMatchObject({
      closingBalance: "-1",
      sequentialId: 0,
      startingBalance: "0",
      startingTime: 0,
      user: UserPK.stringify(testUser),
    });
    userBalance = await getUserBalanceNoCache(context, testUser);
    expect(userBalance).toEqual("-1");
  });
});
