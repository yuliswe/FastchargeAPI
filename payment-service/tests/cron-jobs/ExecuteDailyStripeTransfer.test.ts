import { StripeTransfer } from "@/database/models/StripeTransfer";
import { User } from "@/database/models/User";
import { StripeTransferPK } from "@/pks/StripeTransferPK";
import { UserPK } from "@/pks/UserPK";
import { createTestStripeTransfer } from "@/tests/test-data/StripeTransfer";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { StripeTransferStatus } from "graphql-service-apollo/__generated__/resolvers-types";
import Stripe from "stripe";
import { getTestEventBridgeEvent } from "tests/test-data/EventBridge";
import * as uuid from "uuid";
import {
  lambdaHandler as ExecuteDailyStripeTranferCronJob,
  detailType,
} from "../../cron-jobs/ExecuteDailyStripeTransfer";
import * as stripeClientModule from "../../utils/stripe-client";

describe("ExecuteDailyStripeTransfer", () => {
  let testUser: User;
  let stripeTransfer: StripeTransfer;
  let stripeTransferCreateMock: jest.SpyInstance;
  beforeEach(async () => {
    testUser = await createTestUser(context, {
      stripeConnectAccountId: uuid.v4(),
    });
    stripeTransfer = await createTestStripeTransfer(context, {
      receiver: UserPK.stringify(testUser),
      transferAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    });
    stripeTransferCreateMock = jest.fn().mockReturnValue(Promise.resolve(undefined));
    jest.spyOn(stripeClientModule, "getStripeClient").mockImplementation(() =>
      Promise.resolve({
        transfers: {
          create: stripeTransferCreateMock,
        },
      } as unknown as Stripe)
    );
  });

  test("Dry runs should not transfer money", async () => {
    const resp = ExecuteDailyStripeTranferCronJob(
      getTestEventBridgeEvent({
        detailType,
        detail: {
          dryRun: true,
        },
      })
    );
    await expect(resp).resolves.toEqual({ body: "OK", statusCode: 200 });
    const updatedStripeTransfer = await context.batched.StripeTransfer.get(StripeTransferPK.extract(stripeTransfer));
    expect(updatedStripeTransfer).toMatchObject({
      status: StripeTransferStatus.PendingTransfer,
    });
  });

  test("Transfers money", async () => {
    const resp = ExecuteDailyStripeTranferCronJob(
      getTestEventBridgeEvent({
        detailType,
        detail: {
          dryRun: false,
        },
      })
    );
    await expect(resp).resolves.toEqual({ body: "OK", statusCode: 200 });
    const updatedStripeTransfer = await context.batched.StripeTransfer.get(StripeTransferPK.extract(stripeTransfer));
    expect(updatedStripeTransfer).toMatchSnapshotExceptForProps({
      status: StripeTransferStatus.Transferred,
      receiver: UserPK.stringify(testUser),
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      transferAt: expect.any(Number),
    });
    expect(
      (
        stripeTransferCreateMock.mock.calls.find(
          ([{ destination }]) => destination === testUser.stripeConnectAccountId
        ) as [Stripe.TransferCreateParams]
      )[0]
    ).toMatchSnapshotExceptForProps({
      destination: testUser.stripeConnectAccountId,
      amount: 10000,
    });
  });
});
