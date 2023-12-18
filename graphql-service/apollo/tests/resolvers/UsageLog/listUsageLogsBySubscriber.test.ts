import { App } from "@/database/models/App";
import { Pricing, PricingAvailability } from "@/database/models/Pricing";
import { UsageLog } from "@/database/models/UsageLog";
import { User } from "@/database/models/User";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UsageLogPK } from "@/pks/UsageLogPK";
import { UserPK } from "@/pks/UserPK";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import * as uuid from "uuid";

describe("listUsageLogsBySubscriber", () => {
  let testAppOwner: User;
  let testUsageLogOwner: User;
  let testUsageLog: UsageLog;
  let testApp: App;
  let testPricing: Pricing;
  beforeEach(async () => {
    testAppOwner = await getOrCreateTestUser(context);
    testUsageLogOwner = await getOrCreateTestUser(context);
    testApp = await context.batched.App.createOverwrite({
      name: `testapp-${uuid.v4()}`,
      owner: UserPK.stringify(testAppOwner),
    });
    testPricing = await context.batched.Pricing.create({
      name: "test-pricing",
      app: AppPK.stringify(testApp),
      availability: PricingAvailability.Public,
      minMonthlyCharge: "0",
      chargePerRequest: "0",
      freeQuota: 0,
      callToAction: "test-call-to-action",
    });
    testUsageLog = await context.batched.UsageLog.create({
      app: AppPK.stringify(testApp),
      pricing: PricingPK.stringify(testPricing),
      subscriber: UserPK.stringify(testUsageLogOwner),
      path: "/",
    });
  });

  const listUsageLogsBySubscriberQuery = graphql(`
    query TestListUsageLogsBySubscriber($subscriber: ID!) {
      listUsageLogsBySubscriber(subscriber: $subscriber) {
        pk
      }
    }
  `);

  function getVariables() {
    return {
      subscriber: UserPK.stringify(testUsageLogOwner),
    };
  }

  function getExpected() {
    return {
      data: {
        listUsageLogsBySubscriber: [
          {
            __typename: "UsageLog",
            pk: UsageLogPK.stringify(testUsageLog),
          },
        ],
      },
    };
  }

  test("Usage log owner can call listUsageLogsBySubscriber", async () => {
    const promise = getTestGQLClient({ user: testUsageLogOwner }).query({
      query: listUsageLogsBySubscriberQuery,
      variables: getVariables(),
    });
    await expect(promise).resolves.toMatchObject(getExpected());
  });

  test("Other users cannot call listUsageLogsBySubscriber", async () => {
    const promise = getTestGQLClient({ user: testAppOwner }).query({
      query: listUsageLogsBySubscriberQuery,
      variables: getVariables(),
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "listUsageLogsBySubscriber",
      },
    ]);
  });
});
