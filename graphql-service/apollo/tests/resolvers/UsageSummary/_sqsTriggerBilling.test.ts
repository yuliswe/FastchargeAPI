import { App } from "@/database/models/App";
import { Pricing } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { UserPK } from "@/pks/UserPK";

import { graphql } from "@/__generated__/gql";
import { PricingAvailability, TestSqsTriggerBillingMutationVariables } from "@/__generated__/gql/graphql";
import { AccountActivityPK } from "@/pks/AccountActivityPK";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UsageLogPK } from "@/pks/UsageLogPK";
import { UsageSummaryPK } from "@/pks/UsageSummaryPK";
import { SQSQueueName, getSQSClient } from "@/sqsClient";
import { mockSQS } from "@/tests/test-utils/MockSQS";
import { v4 as uuidv4 } from "uuid";
import { baseRequestContext as context, getOrCreateTestUser } from "../../test-utils/test-utils";

let testAppOwner: User;
let testSubscriber: User;
let testApp: App;
let testPricing: Pricing;

async function _sqsTriggerBilling(variables: TestSqsTriggerBillingMutationVariables) {
  await getSQSClient({
    queueName: SQSQueueName.UsageLogQueue,
    groupId: UserPK.stringify(testSubscriber),
  }).mutate({
    mutation: graphql(`
      mutation TestSQSTriggerBilling($app: ID!, $user: ID!) {
        _sqsTriggerBilling(app: $app, user: $user) {
          app {
            pk
          }
        }
      }
    `),
    variables,
  });
  await mockSQS.waitForQueuesToEmpty();
}

describe("_sqsTriggerBilling", () => {
  beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAppOwnerEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testSubscriberEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    testAppOwner = await getOrCreateTestUser(context, { email: testAppOwnerEmail });
    testSubscriber = await getOrCreateTestUser(context, { email: testSubscriberEmail });
    testApp = await context.batched.App.createOverwrite({
      name: testAppName,
      owner: UserPK.stringify(testAppOwner),
    });
    testPricing = await context.batched.Pricing.create({
      name: "test-pricing",
      app: AppPK.stringify(testApp),
      availability: PricingAvailability.Public,
      minMonthlyCharge: "10",
      chargePerRequest: "0.001",
      freeQuota: 0,
      callToAction: "test-call-to-action",
    });
  });

  test("Call triggerBilling on an app, charges are calculated correctly.", async () => {
    let usageLog = await context.batched.UsageLog.create({
      app: AppPK.stringify(testApp),
      subscriber: UserPK.stringify(testSubscriber),
      path: "/",
      pricing: PricingPK.stringify(testPricing),
    });
    await _sqsTriggerBilling({
      app: AppPK.stringify(testApp),
      user: UserPK.stringify(testSubscriber),
    });
    usageLog = await context.batched.UsageLog.get(UsageLogPK.extract(usageLog));
    expect(usageLog).toMatchObject({
      subscriber: UserPK.stringify(testSubscriber),
      app: AppPK.stringify(testApp),
      status: "collected",
      collectedAt: expect.any(Number),
      path: "/",
      volume: 1,
      pricing: PricingPK.stringify(testPricing),
      usageSummary: expect.any(String),
    });
    const usageSummary = await context.batched.UsageSummary.get(UsageSummaryPK.parse(usageLog.usageSummary!));
    expect(usageSummary).toMatchObject({
      subscriber: UserPK.stringify(testSubscriber),
      createdAt: expect.any(Number),
      app: AppPK.stringify(testApp),
      volume: 1,
      status: "billed",
      billedAt: expect.any(Number),
      numberOfLogs: 1,
      billingRequestChargeAccountActivity: expect.any(String),
      pricing: PricingPK.stringify(testPricing),
    });
    const billingRequestChargeAccountActivity = await context.batched.AccountActivity.get(
      AccountActivityPK.parse(usageSummary.billingRequestChargeAccountActivity!)
    );
    expect(billingRequestChargeAccountActivity).toMatchObject({
      user: UserPK.stringify(testSubscriber),
      createdAt: expect.any(Number),
      type: "outgoing",
      reason: "api_per_request_charge",
      status: "settled",
      settleAt: expect.any(Number),
      amount: "0.001",
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      billedApp: AppPK.stringify(testApp),
      consumedFreeQuota: 0,
    });
    const appOwnerRequestChargeAccountActivity = await context.batched.AccountActivity.get(
      AccountActivityPK.parse(usageSummary.appOwnerRequestChargeAccountActivity!)
    );
    expect(appOwnerRequestChargeAccountActivity).toMatchObject({
      user: UserPK.stringify(testAppOwner),
      createdAt: expect.any(Number),
      type: "incoming",
      reason: "api_per_request_charge",
      status: "settled",
      settleAt: expect.any(Number),
      amount: "0.001",
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      billedApp: AppPK.stringify(testApp),
      consumedFreeQuota: 0,
    });
    const billingMonthlyChargeAccountActivity = await context.batched.AccountActivity.get(
      AccountActivityPK.parse(usageSummary.billingMonthlyChargeAccountActivity!)
    );
    expect(billingMonthlyChargeAccountActivity).toMatchObject({
      user: UserPK.stringify(testSubscriber),
      createdAt: expect.any(Number),
      type: "outgoing",
      reason: "api_min_monthly_charge",
      status: "settled",
      settleAt: expect.any(Number),
      amount: "10",
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      billedApp: AppPK.stringify(testApp),
    });
    const appOwnerServiceFeeAccountActivity = await context.batched.AccountActivity.get(
      AccountActivityPK.parse(usageSummary.appOwnerServiceFeeAccountActivity!)
    );
    expect(appOwnerServiceFeeAccountActivity).toMatchObject({
      user: UserPK.stringify(testAppOwner),
      createdAt: expect.any(Number),
      type: "outgoing",
      reason: "fastchargeapi_per_request_service_fee",
      status: "settled",
      settleAt: expect.any(Number),
      amount: expect.any(String),
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      billedApp: AppPK.stringify(testApp),
    });
  });

  test("Allow 1 free quota, check quota is consumed correctly.", async () => {
    testPricing = await context.batched.Pricing.update(testPricing, {
      freeQuota: 1,
    });
    let usageLog = await context.batched.UsageLog.create({
      app: AppPK.stringify(testApp),
      subscriber: UserPK.stringify(testSubscriber),
      path: "/",
      pricing: PricingPK.stringify(testPricing),
    });
    await _sqsTriggerBilling({
      app: AppPK.stringify(testApp),
      user: UserPK.stringify(testSubscriber),
    });
    usageLog = await context.batched.UsageLog.get(UsageLogPK.extract(usageLog));
    const usageSummary = await context.batched.UsageSummary.get(UsageSummaryPK.parse(usageLog.usageSummary!));
    expect(usageSummary.billingMonthlyChargeAccountActivity).toBeUndefined();
    expect(usageSummary.appOwnerMonthlyChargeAccountActivity).toBeUndefined();
    const billingRequestChargeAccountActivity = await context.batched.AccountActivity.get(
      AccountActivityPK.parse(usageSummary.billingRequestChargeAccountActivity!)
    );
    expect(billingRequestChargeAccountActivity).toMatchObject({
      amount: "0",
      billedApp: AppPK.stringify(testApp),
      consumedFreeQuota: 1,
      createdAt: expect.any(Number),
      description: "API request charge",
      reason: "api_per_request_charge",
      settleAt: expect.any(Number),
      status: "settled",
      type: "outgoing",
      updatedAt: expect.any(Number),
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      user: UserPK.stringify(testSubscriber),
    });
    const appOwnerRequestChargeAccountActivity = await context.batched.AccountActivity.get(
      AccountActivityPK.parse(usageSummary.appOwnerRequestChargeAccountActivity!)
    );
    expect(appOwnerRequestChargeAccountActivity).toMatchObject({
      amount: "0",
      billedApp: AppPK.stringify(testApp),
      consumedFreeQuota: 1,
      createdAt: expect.any(Number),
      description: "API request charge paid by customer",
      reason: "api_per_request_charge",
      settleAt: expect.any(Number),
      status: "settled",
      type: "incoming",
      updatedAt: expect.any(Number),
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      user: UserPK.stringify(testAppOwner),
    });
    const appOwnerServiceFeeAccountActivity = await context.batched.AccountActivity.get(
      AccountActivityPK.parse(usageSummary.appOwnerServiceFeeAccountActivity!)
    );
    expect(appOwnerServiceFeeAccountActivity).toMatchObject({
      user: UserPK.stringify(testAppOwner),
      createdAt: expect.any(Number),
      type: "outgoing",
      reason: "fastchargeapi_per_request_service_fee",
      status: "settled",
      settleAt: expect.any(Number),
      amount: expect.any(String),
      usageSummary: UsageSummaryPK.stringify(usageSummary),
      billedApp: AppPK.stringify(testApp),
    });
    const freeQuotaUsage = await context.batched.FreeQuotaUsage.get({
      subscriber: UserPK.stringify(testSubscriber),
      app: AppPK.stringify(testApp),
    });
    expect(freeQuotaUsage).toMatchObject({
      subscriber: UserPK.stringify(testSubscriber),
      app: AppPK.stringify(testApp),
      usage: 1,
    });
  });
});