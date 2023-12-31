import { User } from "@/database/models/User";
import * as AccountUtils from "@/functions/account";
import { UserPK } from "@/pks/UserPK";
import { createTestAccountActivity } from "@/tests/test-data/AccountActivity";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { AccountActivityReason, AccountActivityStatus, AccountActivityType } from "__generated__/gql/graphql";
import { getTestEventBridgeEvent } from "tests/test-data/EventBridge";
import {
  lambdaHandler as SettlePendingAccountActivitiesPastDueCronjob,
  detailType,
} from "../../cron-jobs/SettlePendingAccountActivitiesPastDue";

describe("SettlePendingAccountActivitiesPastDue", () => {
  let testUsers: User[];
  beforeEach(async () => {
    testUsers = await Promise.all(
      Array(10)
        .fill(undefined)
        .map(async () => {
          const user = await createTestUser(context);
          await createTestAccountActivity(context, {
            user: UserPK.stringify(user),
            reason: AccountActivityReason.ApiMinMonthlyCharge,
            type: AccountActivityType.Incoming,
            amount: "12.34",
            status: AccountActivityStatus.Pending,
            settleAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
          });
          return user;
        })
    );
  });

  test("Should run without error", async () => {
    const resp = SettlePendingAccountActivitiesPastDueCronjob(
      getTestEventBridgeEvent({
        detailType,
        detail: {},
      })
    );
    await expect(resp).resolves.toEqual({ body: "OK", statusCode: 200 });
  });

  test("Should call sqsSettleAccountActivities with each user", async () => {
    const sqsSettleAccountActivities = jest.spyOn(AccountUtils, "sqsSettleAccountActivities");
    await SettlePendingAccountActivitiesPastDueCronjob(
      getTestEventBridgeEvent({
        detailType,
        detail: {},
      })
    );
    const testUserPKs = new Set(testUsers.map((u) => UserPK.stringify(u)));
    expect(
      sqsSettleAccountActivities.mock.calls
        .filter(([reqCxt, accountUser]) => testUserPKs.has(accountUser))
        .map(([reqCxt, accountUser]) => accountUser)
    ).toEqualStringArrayIgnoringOrder([...testUserPKs]);
  });
});
