import { StripePaymentAcceptStatus } from "@/__generated__/gql/graphql";
import { StripePaymentAccept } from "@/database/models/StripePaymentAccept";
import { User } from "@/database/models/User";
import { getSQSDedupIdForSettleStripePaymentAccept } from "@/functions/payment";
import { StripePaymentAcceptPK } from "@/pks/StripePaymentAccept";
import { UserPK } from "@/pks/UserPK";
import { SQSQueueName } from "@/sqsClient";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  getUserBalanceNoCache,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getClientForDirectSQSCall, getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("_sqsSettleStripePaymentAccept", () => {
  const settlePaymentMutation = graphql(`
    mutation TestSettleStripePaymentAccept($pk: ID!) {
      getStripePaymentAccept(pk: $pk) {
        _sqsSettleStripePaymentAccept {
          pk
          status
          amount
        }
      }
    }
  `);

  let testOwnerUser: User;
  let testStripePaymentAccept: StripePaymentAccept;

  beforeEach(async () => {
    testOwnerUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
    testStripePaymentAccept = await context.batched.StripePaymentAccept.create({
      user: UserPK.stringify(testOwnerUser),
      amount: "1",
      stripePaymentStatus: "stripePaymentStatus",
      stripePaymentIntent: "stripePaymentIntent",
      stripeSessionId: "stripeSessionId-" + uuid.v4(),
      stripeSessionObject: {},
    });
  });

  function getExpectedStripePaymentAccept() {
    return {
      data: {
        getStripePaymentAccept: {
          _sqsSettleStripePaymentAccept: {
            __typename: "StripePaymentAccept",
            pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            status: StripePaymentAcceptStatus.Settled,
            amount: "1",
          },
        },
      },
    };
  }

  test("Completes settleStripePaymentAccept succesfully", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testOwnerUser),
      dedupId: getSQSDedupIdForSettleStripePaymentAccept(testStripePaymentAccept),
    }).mutate({
      mutation: settlePaymentMutation,
      variables: {
        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
      },
    });
    await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
  });

  test("Must be called on SQS", async () => {
    const promise = getTestGQLClient({ isServiceRequest: true }).mutate({
      mutation: settlePaymentMutation,
      variables: {
        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: "Must be called from SQS",
        path: "getStripePaymentAccept._sqsSettleStripePaymentAccept",
      },
    ]);
  });

  test("Should update user account balance", async () => {
    const oldBalance = await getUserBalanceNoCache(context, testOwnerUser);
    expect(oldBalance).toBe("0");
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testOwnerUser),
      dedupId: getSQSDedupIdForSettleStripePaymentAccept(testStripePaymentAccept),
    }).mutate({
      mutation: settlePaymentMutation,
      variables: {
        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
      },
    });
    await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
    const newBalance = await getUserBalanceNoCache(context, testOwnerUser);
    expect(newBalance).toBe("1");
  });

  test("Must be called on the Billing Queue", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.UsageLogQueue,
      groupId: UserPK.stringify(testOwnerUser),
      dedupId: getSQSDedupIdForSettleStripePaymentAccept(testStripePaymentAccept),
    }).mutate({
      mutation: settlePaymentMutation,
      variables: {
        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: expect.stringContaining("Must be called on SQS with QueueUrl = "),
        path: "getStripePaymentAccept._sqsSettleStripePaymentAccept",
      },
    ]);
  });

  test("SQS group ID is required", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      dedupId: getSQSDedupIdForSettleStripePaymentAccept(testStripePaymentAccept),
    }).mutate({
      mutation: settlePaymentMutation,
      variables: {
        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: expect.stringContaining("Must be called on SQS with MessageGroupId = "),
        path: "getStripePaymentAccept._sqsSettleStripePaymentAccept",
      },
    ]);
  });

  test("Dedup ID is required", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testOwnerUser),
    }).mutate({
      mutation: settlePaymentMutation,
      variables: {
        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: expect.stringContaining("Must be called on SQS with MessageDeduplicationId = "),
        path: "getStripePaymentAccept._sqsSettleStripePaymentAccept",
      },
    ]);
  });

  test("Using a wrong SQS group ID should fail", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: "XXXX",
      dedupId: getSQSDedupIdForSettleStripePaymentAccept(testStripePaymentAccept),
    }).mutate({
      mutation: settlePaymentMutation,
      variables: {
        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: expect.stringContaining("Must be called on SQS with MessageGroupId = "),
        path: "getStripePaymentAccept._sqsSettleStripePaymentAccept",
      },
    ]);
  });

  test("Using a wrong dedup ID should fail", async () => {
    const promise = getClientForDirectSQSCall({
      queueName: SQSQueueName.BillingQueue,
      groupId: UserPK.stringify(testOwnerUser),
      dedupId: "XXX",
    }).mutate({
      mutation: settlePaymentMutation,
      variables: {
        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "NOT_ACCEPTED",
        message: expect.stringContaining("Must be called on SQS with MessageDeduplicationId = "),
        path: "getStripePaymentAccept._sqsSettleStripePaymentAccept",
      },
    ]);
  });
});
