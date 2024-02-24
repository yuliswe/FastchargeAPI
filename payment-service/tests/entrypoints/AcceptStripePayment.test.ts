import { User } from "@/src/database/models/User";
import { UserPK } from "@/src/pks/UserPK";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { createTestUser } from "graphql-service-apollo/tests/test-data/User";
import { mockSQS } from "graphql-service-apollo/tests/test-utils/MockSQS";
import { handle as AcceptPaymentLambdaHandler, StripeSessionObject } from "handlers/AcceptStripePayment";
import stripe from "stripe";
import { getTestAcceptStripePaymentLambdaEvent } from "tests/test-data/AcceptStripePayment";
import * as StripeClientUtils from "utils/stripe-client";
import { v4 as uuidv4 } from "uuid";

describe("AcceptStripePayment", () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser(context);

    console.log(
      "A checkout.session.completed event where payment_status === 'paid'" +
        " should create an StripePaymentAccept object in the SQS, and settle it immediately"
    );

    jest.spyOn(StripeClientUtils, "parseStripeWebhookEvent").mockImplementation((result) => {
      const stripeEvent = JSON.parse(result.body!) as stripe.Event;
      stripeEvent.type = "checkout.session.completed";
      const sessionObject: StripeSessionObject = {
        ...(stripeEvent.data.object as StripeSessionObject),
        payment_status: "paid",
      };
      stripeEvent.data.object = sessionObject;
      return Promise.resolve(stripeEvent);
    });
  });

  test("create order and fulfill immediately. The StripePaymentAccept object should be settled.", async () => {
    const event = getTestAcceptStripePaymentLambdaEvent({
      userPK: UserPK.stringify(testUser),
      userEmail: testUser.email,
      sessionId: uuidv4(),
    });
    await AcceptPaymentLambdaHandler(event);
    const newPaymentAccept = await context.batched.StripePaymentAccept.get({
      user: UserPK.stringify(testUser),
    });
    expect(newPaymentAccept).not.toBeNull();
    expect(newPaymentAccept.status).toBe("settled");
  });

  test("AcceptPayment is idempotent by invoking the handler with the same checkout session id. Only one StripePaymentAccept should be created.", async () => {
    const event = getTestAcceptStripePaymentLambdaEvent({
      userPK: UserPK.stringify(testUser),
      userEmail: testUser.email,
      sessionId: uuidv4(),
    });
    mockSQS.setAutoWaitForQueuesToEmpty(true);
    const requests = Array(10)
      .fill(null)
      .map((x) => AcceptPaymentLambdaHandler(event));
    await Promise.all(requests);
    await mockSQS.waitForQueuesToEmpty();
    const count = await context.batched.StripePaymentAccept.count({ user: UserPK.stringify(testUser) });
    expect(count).toBe(1);
  });
});
