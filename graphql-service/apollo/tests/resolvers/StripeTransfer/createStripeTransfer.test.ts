import { StripeTransferStatus } from "@/__generated__/resolvers-types";
import { User } from "@/database/models/User";
import { UserPK } from "@/pks/UserPK";
import { StripeTransferResolvers } from "@/resolvers/StripeTransfer";
import { mockSQS } from "@/tests/test-utils/MockSQS";
import {
  addMoneyForUser,
  baseRequestContext as context,
  getGraphQLDataOrError,
  getOrCreateTestUser,
  getUserBalanceNoCache,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import * as uuid from "uuid";

const _sqsSettleStripeTransferSpy = () =>
  jest.spyOn(StripeTransferResolvers.StripeTransfer, "_sqsSettleStripeTransfer");

describe("createStripeTransfer", () => {
  let testOwnerUser: User;
  let testOtherUser: User;

  beforeEach(async () => {
    testOwnerUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
    testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
    await addMoneyForUser(context, { user: UserPK.stringify(testOwnerUser), amount: "100" });
  });

  const createStripeTransferMutation = graphql(`
    mutation TestCreateStripeTransfer($receiver: ID!, $withdrawAmount: NonNegativeDecimal!) {
      createStripeTransfer(receiver: $receiver, withdrawAmount: $withdrawAmount) {
        pk
      }
    }
  `);

  function getVariables() {
    return {
      receiver: UserPK.stringify(testOwnerUser),
      withdrawAmount: "10",
      transferAt: Date.now(),
    };
  }

  function getExpectedStripeTransfer() {
    return {
      data: {
        createStripeTransfer: {
          pk: expect.any(String),
        },
      },
    };
  }

  test("User can create StripeTransfer for themselves", async () => {
    const promise = getTestGQLClient({ user: testOwnerUser }).mutate({
      mutation: createStripeTransferMutation,
      variables: getVariables(),
    });

    await expect(promise).resolves.toMatchObject(getExpectedStripeTransfer());
  });

  test("A user can not create StripeTransfer for another user", async () => {
    const promise = getTestGQLClient({ user: testOwnerUser }).mutate({
      mutation: createStripeTransferMutation,
      variables: { ...getVariables(), receiver: UserPK.stringify(testOtherUser) },
    });

    await expect(getGraphQLDataOrError(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "createStripeTransfer",
      },
    ]);
  });

  test("Receivable amount must be greater than 0", async () => {
    const promise = getTestGQLClient({ user: testOwnerUser }).mutate({
      mutation: createStripeTransferMutation,
      variables: { ...getVariables(), withdrawAmount: 0.1 },
    });
    await expect(getGraphQLDataOrError(promise)).rejects.toMatchSnapshot();
  });

  test("Withdrawal amount should be deducted from user balance.", async () => {
    const _sqsSettleStripeTransfer = _sqsSettleStripeTransferSpy();

    const promise = getTestGQLClient({ user: testOwnerUser }).mutate({
      mutation: createStripeTransferMutation,
      variables: getVariables(),
    });

    await expect(promise).resolves.toMatchObject(getExpectedStripeTransfer());

    await mockSQS.waitForQueuesToEmpty();
    expect(_sqsSettleStripeTransfer).toHaveBeenCalledTimes(1);
    await expect(_sqsSettleStripeTransfer.mock.results[0].value).resolves.toMatchObject({
      status: StripeTransferStatus.PendingTransfer,
    });
    const newBalance = await getUserBalanceNoCache(context, testOwnerUser);
    expect(newBalance).toEqual("90");
  });

  test("Cannot create a withdrawal more than the current balance", async () => {
    const promise = getTestGQLClient({ user: testOwnerUser }).mutate({
      mutation: createStripeTransferMutation,
      variables: { ...getVariables(), withdrawAmount: "101" },
    });

    await expect(getGraphQLDataOrError(promise)).rejects.toMatchObject([
      {
        code: "BAD_USER_INPUT",
        message: "User does not have enough balance to withdraw 101",
        path: "createStripeTransfer",
      },
    ]);
  });
});
