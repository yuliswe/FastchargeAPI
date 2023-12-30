import { StripeTransferStatus } from "@/__generated__/resolvers-types";
import { StripeTransfer } from "@/database/models/StripeTransfer";
import { User } from "@/database/models/User";
import { getSQSDedupIdForSettleStripeTransfer } from "@/functions/transfer";
import { StripeTransferPK } from "@/pks/StripeTransferPK";
import { UserPK } from "@/pks/UserPK";
import { SQSQueueName } from "@/sqsClient";
import {
  addMoneyForUser,
  baseRequestContext as context,
  getOrCreateTestUser,
  getUserBalanceNoCache,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getClientForDirectSQSCall, getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import * as uuid from "uuid";

describe("_sqsSettleStripeTransfer", () => {
  let testOwnerUser: User;
  let testStripeTransfer: StripeTransfer;

  beforeEach(async () => {
    testOwnerUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
    testStripeTransfer = await context.batched.StripeTransfer.create({
      receiver: UserPK.stringify(testOwnerUser),
      withdrawAmount: "10",
      receiveAmount: "10",
      status: StripeTransferStatus.Created,
      transferAt: Date.now(),
    });
    await addMoneyForUser(context, { user: UserPK.stringify(testOwnerUser), amount: "100" });
  });

  const _sqsSettleStripeTransferMutation = graphql(`
    mutation Test_sqsSettleStripeTransfer($pk: ID!) {
      getStripeTransfer(pk: $pk) {
        _sqsSettleStripeTransfer {
          pk
          status
        }
      }
    }
  `);

  function getVariables() {
    return {
      pk: StripeTransferPK.stringify(testStripeTransfer),
    };
  }

  test("Can be called from SQS", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testOwnerUser),
      dedupId: getSQSDedupIdForSettleStripeTransfer(testStripeTransfer),
    }).mutate({
      mutation: _sqsSettleStripeTransferMutation,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getStripeTransfer: {
          __typename: "StripeTransfer",
          _sqsSettleStripeTransfer: {
            __typename: "StripeTransfer",
            pk: StripeTransferPK.stringify(testStripeTransfer),
            status: StripeTransferStatus.PendingTransfer,
          },
        },
      },
    });
  });

  test("If user balance is insufficient, update status to FailedDueToInsufficientBalance", async () => {
    await context.batched.StripeTransfer.update(testStripeTransfer, {
      withdrawAmount: "1000000",
      receiveAmount: "1000000",
    });
    const oldBalance = await getUserBalanceNoCache(context, testOwnerUser);
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testOwnerUser),
      dedupId: getSQSDedupIdForSettleStripeTransfer(testStripeTransfer),
    }).mutate({
      mutation: _sqsSettleStripeTransferMutation,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getStripeTransfer: {
          __typename: "StripeTransfer",
          _sqsSettleStripeTransfer: {
            __typename: "StripeTransfer",
            pk: StripeTransferPK.stringify(testStripeTransfer),
            status: StripeTransferStatus.FailedDueToInsufficientBalance,
          },
        },
      },
    });
    const newBalance = await getUserBalanceNoCache(context, testOwnerUser);
    expect(newBalance).toEqual(oldBalance);
  });

  test("Should reject if not called from SQS", async () => {
    const promise = getTestGQLClient({ isServiceRequest: true }).mutate({
      mutation: _sqsSettleStripeTransferMutation,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: "Must be called from SQS",
        path: "getStripeTransfer._sqsSettleStripeTransfer",
      },
    ]);
  });

  test("Should reject is not called on the billing queue", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.UsageLogQueue,
      groupId: UserPK.stringify(testOwnerUser),
      dedupId: getSQSDedupIdForSettleStripeTransfer(testStripeTransfer),
    }).mutate({
      mutation: _sqsSettleStripeTransferMutation,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message:
          'Must be called on SQS with QueueUrl = "graphql-service-billing-queue.fifo". Got: graphql-service-usage-log-queue.fifo',
        path: "getStripeTransfer._sqsSettleStripeTransfer",
      },
    ]);
  });

  test("Should reject if group id is not user pk", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: "xxx",
      dedupId: getSQSDedupIdForSettleStripeTransfer(testStripeTransfer),
    }).mutate({
      mutation: _sqsSettleStripeTransferMutation,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: expect.stringContaining("Must be called on SQS with MessageGroupId = "),
        path: "getStripeTransfer._sqsSettleStripeTransfer",
      },
    ]);
  });

  test("Should reject if dedup id is incorrect", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testOwnerUser),
      dedupId: "XXX",
    }).mutate({
      mutation: _sqsSettleStripeTransferMutation,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: expect.stringContaining("Must be called on SQS with MessageDeduplicationId = "),
        path: "getStripeTransfer._sqsSettleStripeTransfer",
      },
    ]);
  });
});
