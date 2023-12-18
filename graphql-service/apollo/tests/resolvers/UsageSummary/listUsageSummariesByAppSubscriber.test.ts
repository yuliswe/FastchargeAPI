import { graphql } from "@/__generated__/gql";
import { App } from "@/database/models/App";
import { Pricing } from "@/database/models/Pricing";
import { UsageSummary } from "@/database/models/UsageSummary";
import { User } from "@/database/models/User";
import { Can } from "@/permissions";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserPK } from "@/pks/UserPK";
import { createTestApp } from "@/tests/test-data/App";
import { createTestPricing } from "@/tests/test-data/Pricing";
import { createTestUsageSummary } from "@/tests/test-data/UsageSummary";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context, simplifyGraphQLPromiseRejection } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

describe("listUsageSummariesByAppSubscriber", () => {
  let testSubscriber: User;
  let testOtherUser: User;
  let testAppOwner: User;
  let testApp: App;
  let testPricing: Pricing;
  const testUsageSummaries: UsageSummary[] = [];

  const listUsageSummariesByAppSubscriberQuery = graphql(`
    query TestListUsageSummary($subscriber: ID!, $app: ID!) {
      listUsageSummariesByAppSubscriber(subscriber: $subscriber, app: $app) {
        pk
        status
        billedAt
        billed
        volume
        app {
          pk
        }
        subscriber {
          pk
        }
        billingRequestChargeAccountActivity {
          pk
        }
      }
    }
  `);

  beforeEach(async () => {
    testOtherUser = await createTestUser(context);
    testSubscriber = await createTestUser(context);
    testAppOwner = await createTestUser(context);
    testApp = await createTestApp(context, {
      owner: UserPK.stringify(testAppOwner),
    });
    testPricing = await createTestPricing(context, {
      app: AppPK.stringify(testApp),
    });
    for (let i = 0; i < 3; i++) {
      const usageSummary = await createTestUsageSummary(context, {
        app: AppPK.stringify(testApp),
        subscriber: UserPK.stringify(testSubscriber),
        volume: 1,
        numberOfLogs: 1,
        pricing: PricingPK.stringify(testPricing),
      });
      testUsageSummaries.push(usageSummary);
    }
  });

  test("UsageSummary owner (subscriber) can list UsageSummaries", async () => {
    const result = await getTestGQLClient({ user: testSubscriber }).query({
      query: listUsageSummariesByAppSubscriberQuery,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    for (const usageSummary of result.data.listUsageSummariesByAppSubscriber) {
      expect(usageSummary).toMatchSnapshotExceptForProps({
        pk: expect.any(String),
        app: {
          pk: AppPK.stringify(testApp),
        },
        subscriber: {
          pk: UserPK.stringify(testSubscriber),
        },
      });
    }
  });

  test("A user cannot list UsageSummaries that they don't own", async () => {
    const result = getTestGQLClient({ user: testAppOwner }).query({
      query: listUsageSummariesByAppSubscriberQuery,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "listUsageSummariesByAppSubscriber",
      },
    ]);
  });

  test("A user cannot see the private fields of UsageSummaries on an object that they don't own", async () => {
    // Forces the listUsageSummariesByAppSubscriber to pass so that we can test the private
    // fields.
    jest.spyOn(Can, "listUsageSummariesByAppSubscriber").mockImplementation(() => Promise.resolve(true));
    const result = getTestGQLClient({ user: testOtherUser }).query({
      query: listUsageSummariesByAppSubscriberQuery,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchSnapshot();
  });

  test("App ower cannot see any field of a subscriber's UsageSummary other than volume", async () => {
    // Forces the listUsageSummariesByAppSubscriber to pass so that we can test the private
    // fields.
    jest.spyOn(Can, "listUsageSummariesByAppSubscriber").mockImplementation(() => Promise.resolve(true));
    const result = getTestGQLClient({ user: testAppOwner }).query({
      query: listUsageSummariesByAppSubscriberQuery,
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchSnapshot();
  });

  test("App owner can see the volume field of a subscriber's UsageSummary", async () => {
    // Forces the listUsageSummariesByAppSubscriber to pass so that we can test the private
    // fields.
    jest.spyOn(Can, "listUsageSummariesByAppSubscriber").mockImplementation(() => Promise.resolve(true));
    const result = getTestGQLClient({ user: testAppOwner }).query({
      query: graphql(`
        query TestAppOwnerCanReadVolume($subscriber: ID!, $app: ID!) {
          listUsageSummariesByAppSubscriber(subscriber: $subscriber, app: $app) {
            volume
          }
        }
      `),
      variables: {
        subscriber: UserPK.stringify(testSubscriber),
        app: AppPK.stringify(testApp),
      },
    });
    await expect(result).resolves.toMatchSnapshot();
  });
});
