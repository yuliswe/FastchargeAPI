import { StripePaymentAccept } from "@/src/database/models/StripePaymentAccept";
import { User } from "@/src/database/models/User";
import { StripePaymentAcceptPK } from "@/src/pks/StripePaymentAccept";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import {
  baseRequestContext as context,
  getAdminUser,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

describe("getStripePaymentAcceptByStripeSessionId", () => {
  let testOwnerUser: User;
  let testOtherUser: User;
  let testStripePaymentAccept: StripePaymentAccept;

  beforeEach(async () => {
    testOwnerUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
    testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
    testStripePaymentAccept = await context.batched.StripePaymentAccept.create({
      user: UserPK.stringify(testOwnerUser),
      amount: "1",
      stripePaymentStatus: "stripePaymentStatus",
      stripePaymentIntent: "stripePaymentIntent",
      stripeSessionId: "stripeSessionId-" + uuid.v4(),
      stripeSessionObject: {},
    });
  });

  const getStripePaymentAcceptByStripeSessionIdQuery = graphql(`
    query TestGetStripePaymentAcceptByStripeSessionId($user: ID!, $stripeSessionId: String!) {
      getStripePaymentAcceptByStripeSessionId(user: $user, stripeSessionId: $stripeSessionId) {
        pk
      }
    }
  `);

  function getVariables() {
    return {
      user: UserPK.stringify(testOwnerUser),
      stripeSessionId: testStripePaymentAccept.stripeSessionId,
    };
  }

  function getExpectedStripePaymentAccept() {
    return {
      data: {
        getStripePaymentAcceptByStripeSessionId: {
          __typename: "StripePaymentAccept",
          pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
        },
      },
    };
  }

  test("Admin user can get StripePaymentAccept", async () => {
    const promise = getTestGQLClient({ user: await getAdminUser(context) }).query({
      query: getStripePaymentAcceptByStripeSessionIdQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
  });

  test("Service user can get StripePaymentAccept", async () => {
    const promise = getTestGQLClient({ isServiceRequest: true }).query({
      query: getStripePaymentAcceptByStripeSessionIdQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
  });

  test("Owner user can get StripePaymentAccept", async () => {
    const promise = getTestGQLClient({ user: testOwnerUser }).query({
      query: getStripePaymentAcceptByStripeSessionIdQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
  });

  test("Other user cannot get StripePaymentAccept", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).query({
      query: getStripePaymentAcceptByStripeSessionIdQuery,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "getStripePaymentAcceptByStripeSessionId",
      },
    ]);
  });
});
