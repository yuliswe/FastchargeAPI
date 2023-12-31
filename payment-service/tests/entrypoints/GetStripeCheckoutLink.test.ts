import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { User } from "@/database/models/User";
import { UserPK } from "@/pks/UserPK";
import { baseRequestContext } from "@/tests/test-utils/test-utils";
import { createTestUser } from "graphql-service-apollo/tests/test-data/User";
import {
  ErrorResponseBody,
  SuccessResponseBody,
  handle as lambdaHandlerGetStripeCheckoutLink,
} from "../../handlers/GetStripeCheckoutLink";
import { makeGetStripeCheckoutLinkLambdaEvent } from "../test-data/GetStripeCheckoutLink";

const context: RequestContext = {
  ...baseRequestContext,
  service: "payment",
  isServiceRequest: true,
  isSQSMessage: true,
  batched: createDefaultContextBatched(),
  isAnonymousUser: false,
  isAdminUser: false,
};

describe("Create a Stripe checkout session", () => {
  let testUser: User;

  beforeAll(async () => {
    testUser = await createTestUser(context);
  });

  test("A successful topup", async () => {
    const response = await lambdaHandlerGetStripeCheckoutLink(
      makeGetStripeCheckoutLinkLambdaEvent({
        userPK: UserPK.stringify(testUser),
        body: JSON.stringify({
          successUrl: "https://fastchargeapi.com/topup?success=true",
          cancelUrl: "https://fastchargeapi.com/topup?cancel=true",
          amount: "1000",
        }),
      }),
      { skipBalanceCheck: true }
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body!) as SuccessResponseBody;
    expect(body).toHaveProperty("location");
    expect(body.location).toMatch(/^https:\/\/checkout.stripe.com/);
  });

  test("A topup with less than $1", async () => {
    const response = await lambdaHandlerGetStripeCheckoutLink(
      makeGetStripeCheckoutLinkLambdaEvent({
        userPK: UserPK.stringify(testUser),
        body: JSON.stringify({
          successUrl: "https://fastchargeapi.com/topup?success=true",
          cancelUrl: "https://fastchargeapi.com/topup?cancel=true",
          amount: "0.99",
        }),
      })
    );
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body!) as ErrorResponseBody;
    expect(body.error).toMatch(/.*at least \$1.*/);
  });

  test("A topup with more than $100", async () => {
    const response = await lambdaHandlerGetStripeCheckoutLink(
      makeGetStripeCheckoutLinkLambdaEvent({
        userPK: UserPK.stringify(testUser),
        body: JSON.stringify({
          successUrl: "https://fastchargeapi.com/topup?success=true",
          cancelUrl: "https://fastchargeapi.com/topup?cancel=true",
          amount: "100.01",
        }),
      })
    );
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body!) as ErrorResponseBody;
    expect(body.error).toMatch(/.*exceed.+limit.*/);
  });
});
