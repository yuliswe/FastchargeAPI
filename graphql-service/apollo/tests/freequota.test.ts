import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { UserPK } from "../pks/UserPK";
import { PricingPK } from "../pks/PricingPK";
import { App, Pricing, UsageSummary, User } from "../dynamoose/models";
import { AppPK } from "../pks/AppPK";
import { collectUsageLogs } from "../functions/usage";
import {
    GenerateAccountActivitiesResult,
    fastchargeRequestServiceFee,
    generateAccountActivities,
} from "../functions/billing";
import Decimal from "decimal.js-light";
import { v4 as uuidv4 } from "uuid";
import { getOrCreateTestUser, createOrUpdatePricing, getOrCreateFreeQuotaUsage } from "./test-utils";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
};

FreeQuotaUsageTestCase({
    description: "Subcription with free quota should not reduce user's account balance",
    freeQuota: 10,
    minMonthlyCharge: "10",
    chargePerRequest: "0.001",
    resetFreeQuotaUsageTo: 0,
    makeNumberOfRequests: 10,
    disableMonthlyCharge: true,
    forceMonthlyCharge: false,
    runExpect(result: GenerateAccountActivitiesResult) {
        expect(result.volumeBilled).toEqual(0);
        expect(result.volumeFree).toEqual(10);

        // User should not be charged for the first ${testParams.freeQuota} requests
        expect(result.createdAccountActivities.subscriberRequestFee.amount).toStrictEqual("0");
        expect(result.createdAccountActivities.subscriberRequestFee.consumedFreeQuota).toStrictEqual(10);
        expect(result.createdAccountActivities.appAuthorRequestFee.amount).toStrictEqual("0");
        expect(result.createdAccountActivities.appAuthorRequestFee.consumedFreeQuota).toStrictEqual(10);

        // Check FastchargeAPI fee
        expect(result.createdAccountActivities.appAuthorServiceFee.amount).toStrictEqual(
            new Decimal(fastchargeRequestServiceFee).mul(10).toString()
        );

        // No monthly fees should be charged
        expect(result.createdAccountActivities.subscriberMonthlyFee).toBeNull();
        expect(result.createdAccountActivities.appAuthorMonthlyFee).toBeNull();

        expect(result.affectedFreeQuotaUsage).not.toBeNull();
        expect(result.affectedFreeQuotaUsage!.usage).toStrictEqual(10);
    },
});

FreeQuotaUsageTestCase({
    description: "With not enough free quota, subscrber should be charged for half of the requests",
    freeQuota: 10,
    minMonthlyCharge: "10",
    chargePerRequest: "0.001",
    resetFreeQuotaUsageTo: 0,
    makeNumberOfRequests: 20, // 10 requests are free, 10 requests are billed
    disableMonthlyCharge: true,
    forceMonthlyCharge: false,
    runExpect(result: GenerateAccountActivitiesResult) {
        expect(result.volumeBilled).toEqual(10);
        expect(result.volumeFree).toEqual(10);

        // User should not be charged for the first ${testParams.freeQuota} requests
        expect(result.createdAccountActivities.subscriberRequestFee.amount).toStrictEqual("0.01");
        expect(result.createdAccountActivities.subscriberRequestFee.consumedFreeQuota).toStrictEqual(10);
        expect(result.createdAccountActivities.appAuthorRequestFee.amount).toStrictEqual("0.01");
        expect(result.createdAccountActivities.appAuthorRequestFee.consumedFreeQuota).toStrictEqual(10);

        // Check FastchargeAPI fee
        expect(result.createdAccountActivities.appAuthorServiceFee.amount).toStrictEqual(
            new Decimal(fastchargeRequestServiceFee).mul(20).toString()
        );

        expect(result.affectedFreeQuotaUsage).not.toBeNull();
        expect(result.affectedFreeQuotaUsage!.usage).toStrictEqual(10);
    },
});

type TestCaseParams = {
    description: string;
    freeQuota: number;
    minMonthlyCharge: string;
    chargePerRequest: string;
    resetFreeQuotaUsageTo: number;
    makeNumberOfRequests: number;
    disableMonthlyCharge: boolean;
    forceMonthlyCharge: boolean;
    runExpect: (result: GenerateAccountActivitiesResult) => Promise<void> | void;
};
function FreeQuotaUsageTestCase(testParams: TestCaseParams) {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppName = `testapp-${uuidv4()}`;
    let testUser: User;
    let testApp: App;
    // jest.retryTimes(2);
    describe(testParams.description, () => {
        test("Prepare: Create test user and test app", async () => {
            testUser = await getOrCreateTestUser(context, { email: testUserEmail });
            testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testUser) });
        });

        let pricing: Pricing;
        test("Prepare: Create a pricing with 10 free quota", async () => {
            pricing = await createOrUpdatePricing(
                context,
                { name: "WithFreeQuota", app: testApp },
                {
                    freeQuota: testParams.freeQuota,
                    minMonthlyCharge: testParams.minMonthlyCharge,
                    chargePerRequest: testParams.chargePerRequest,
                }
            );
            expect(pricing.freeQuota).toStrictEqual(10);
        });

        test("Prepare: Subscribe test user to the pricing", async () => {
            let sub = await context.batched.Subscription.getOrNull({
                subscriber: UserPK.stringify(testUser),
                app: AppPK.stringify(testApp),
            });
            if (sub == null) {
                sub = await context.batched.Subscription.create({
                    subscriber: UserPK.stringify(testUser),
                    app: AppPK.stringify(testApp),
                    pricing: PricingPK.stringify(pricing),
                });
            } else {
                await context.batched.Subscription.update(sub, {
                    pricing: PricingPK.stringify(pricing),
                });
            }
        });

        let usageSummary: UsageSummary;
        test(`Prepare: Create ${testParams.makeNumberOfRequests} usage logs and a usage summary`, async () => {
            const promises = [];
            for (let i = 0; i < testParams.makeNumberOfRequests; i++) {
                const p = context.batched.UsageLog.create({
                    subscriber: UserPK.stringify(testUser),
                    app: AppPK.stringify(testApp),
                    path: "/example",
                    pricing: PricingPK.stringify(pricing),
                    volume: 1,
                });
                // Wait for 10ms to avoid creating logs with the same timestamp
                await new Promise((resolve) => setTimeout(resolve, 10));
                promises.push(p);
            }
            await Promise.all(promises);
            const { affectedUsageSummaries } = await collectUsageLogs(context, {
                user: UserPK.stringify(testUser),
                app: AppPK.stringify(testApp),
            });
            expect(affectedUsageSummaries.length).toStrictEqual(1);
            usageSummary = affectedUsageSummaries[0];
        });

        test(`Test: Reset the FreeQuotaUsage to ${testParams.resetFreeQuotaUsageTo}, then call generateAccountActivities()`, async () => {
            const oldFreeQuotaUsage = await getOrCreateFreeQuotaUsage(context, {
                subscriber: UserPK.stringify(testUser),
                app: AppPK.stringify(testApp),
            });

            await context.batched.FreeQuotaUsage.update(oldFreeQuotaUsage, {
                usage: testParams.resetFreeQuotaUsageTo,
            });

            const result = await generateAccountActivities(context, {
                usageSummary,
                subscriber: UserPK.stringify(testUser),
                appAuthor: testApp.owner,
                disableMonthlyCharge: testParams.disableMonthlyCharge,
                forceMonthlyCharge: testParams.forceMonthlyCharge,
            });

            await testParams.runExpect(result);
        });
    });
}
