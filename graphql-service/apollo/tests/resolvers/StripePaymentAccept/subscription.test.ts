import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { Subscription, UsageLogModel, UsageSummaryModel, User } from "@/database/models";
import { AlreadyExists } from "@/errors";
import { settleAccountActivities } from "@/functions/account";
import { generateAccountActivities } from "@/functions/billing";
import { collectUsageLogs as collectUsageSummary } from "@/functions/usage";
import { PricingPK } from "@/pks/PricingPK";
import { UsageLogPK } from "@/pks/UsageLogPK";
import { UsageSummaryPK } from "@/pks/UsageSummaryPK";
import { UserPK } from "@/pks/UserPK";
import { UsageLogResolvers } from "@/resolvers/UsageLog";
import { getOrCreateTestUser } from "@/tests/test-utils";
import { describe, expect, test } from "@jest/globals";
import Decimal from "decimal.js-light";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isSQSMessage: true,
    isServiceRequest: true,
    isAnonymousUser: false,
    isAdminUser: false,
};
// jest.retryTimes(2);
describe("Test when making a request the monthly subscription fee is charged.", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser: User;

    test("Preparation: get test user 1", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
        context.sqsMessageGroupId = UserPK.stringify(testUser);
    });

    test("Preparation: create an App", async () => {
        try {
            const app = await context.batched.App.create({
                name: "myapp",
                owner: UserPK.stringify(testUser),
            });
        } catch (e) {
            if (e instanceof AlreadyExists) {
                console.log("App already exists");
            } else {
                throw e;
            }
        }
    });

    let pricingPK: string;
    test("Preparation: create a Pricing or use existing", async () => {
        const pricingRequirement = {
            app: "myapp",
            name: "Premium",
            minMonthlyCharge: "1",
            chargePerRequest: "0.001",
        };
        let pricing = await context.batched.Pricing.getOrNull(pricingRequirement);
        if (pricing === null) {
            pricing = await context.batched.Pricing.create(pricingRequirement);
        }
        pricingPK = PricingPK.stringify(pricing);
    });

    let subscription: Subscription;
    test("Preparation: subscribe user to this Pricing", async () => {
        const sub = await context.batched.Subscription.getOrNull({
            subscriber: UserPK.stringify(testUser),
        });
        if (sub === null) {
            subscription = await context.batched.Subscription.create({
                app: "myapp",
                subscriber: UserPK.stringify(testUser),
                pricing: pricingPK,
            });
        } else {
            subscription = await context.batched.Subscription.update(sub, { pricing: pricingPK });
        }
    });

    let usageLogPK: string;
    test("Preparation: create 3 UsageLogs", async () => {
        for (let i = 0; i < 3; i++) {
            const usageLog = (await UsageLogResolvers.Mutation!.createUsageLog!(
                {},
                {
                    subscriber: UserPK.stringify(testUser),
                    app: "myapp",
                    path: "/google",
                    volume: 1,
                    pricing: pricingPK,
                },
                context,
                {} as never
            ))!;
            expect(usageLog).not.toBeNull();
            usageLogPK = UsageLogPK.stringify(usageLog);
        }
    });

    let usageSummaryPK: string;
    test("Create a UsageSummary", async () => {
        const { affectedUsageSummaries } = await collectUsageSummary(context, {
            user: UserPK.stringify(testUser),
            app: "myapp",
            path: "/",
        });
        const usageSummary = affectedUsageSummaries[0];
        const usageLog = await UsageLogModel.get(UsageLogPK.parse(usageLogPK));
        expect(usageSummary).not.toBeNull();
        expect(usageSummary.numberOfLogs).toEqual(3);
        expect(usageLog.status).toEqual("collected");
        expect(usageLog.usageSummary).toEqual(UsageSummaryPK.stringify(usageSummary));
        usageSummaryPK = UsageSummaryPK.stringify(usageSummary);
    });

    /**
     * This step should create 4 AccountActivities:
     * 1. Monthly fee for the app author as income (debit)
     * 2. Monthly fee for the subscriber as credit
     * 3. Request fee for the app author
     * 4. Request fee for the subscriber
     */
    test("Create AccountActivity", async () => {
        const usageSummary = await UsageSummaryModel.get(UsageSummaryPK.parse(usageSummaryPK));
        const result = await generateAccountActivities(context, {
            usageSummary,
            subscriber: UserPK.stringify(testUser),
            appAuthor: UserPK.stringify(testUser),
            forceMonthlyCharge: true,
        });
        expect(result).not.toBeNull();
        expect(result.createdAccountActivities.appAuthorMonthlyFee).not.toBeNull();
        expect(result.createdAccountActivities.subscriberMonthlyFee).not.toBeNull();
        expect(result.createdAccountActivities.appAuthorRequestFee).not.toBeNull();
        expect(result.createdAccountActivities.subscriberRequestFee).not.toBeNull();
        expect(result.createdAccountActivities.appAuthorServiceFee).not.toBeNull();
        expect(result.createdAccountActivities.appAuthorMonthlyFee?.amount).toEqual("1");
        expect(result.createdAccountActivities.appAuthorMonthlyFee?.type).toEqual("debit");
        expect(result.createdAccountActivities.subscriberMonthlyFee?.amount).toEqual("1");
        expect(result.createdAccountActivities.subscriberMonthlyFee?.type).toEqual("credit");
        expect(result.createdAccountActivities.appAuthorServiceFee?.type).toEqual("credit");

        const now = Date.now();
        expect(result.createdAccountActivities.subscriberMonthlyFee?.settleAt).toBeLessThan(now);
        expect(result.createdAccountActivities.subscriberRequestFee?.settleAt).toBeLessThan(now);
        expect(result.createdAccountActivities.appAuthorRequestFee?.settleAt).toBeLessThan(now);
        expect(result.createdAccountActivities.appAuthorServiceFee?.settleAt).toBeLessThan(now);
        expect(result.createdAccountActivities.appAuthorMonthlyFee?.settleAt).toBeGreaterThan(now);
    });

    /**
     * This step should create 1 AccountHistory. It should cause these 4 of 5
     * AccountActivities that were created in the previous step to be settled:
     *  1. Monthly fee for the subscriber as credit
     *  2. Request fee for the app author
     *  3. Request fee for the subscriber
     *  4. Fastcharge service fee for the app author
     *
     * The AccountActivity not settled is the Monthly fee for the app author as
     * income, and we should check that the settleAt property of this
     * AccountActivity is in the future in the previous step.
     */
    test("Create AccountHistory", async () => {
        const result = (await settleAccountActivities(context, UserPK.stringify(testUser)))!;
        expect(result).not.toBeNull();
        const { newAccountHistory, affectedAccountActivities, previousAccountHistory } = result;
        expect(affectedAccountActivities.length).toEqual(4);
        if (previousAccountHistory) {
            expect(newAccountHistory.startingTime).toEqual(previousAccountHistory.closingTime);
            expect(new Decimal(newAccountHistory.closingBalance).toString()).toEqual(
                new Decimal(previousAccountHistory.closingBalance).sub("1.0003").toString()
            );
        } else {
            expect(newAccountHistory.startingTime).toEqual(0);
            expect(newAccountHistory.closingBalance).toEqual("-1.0003");
        }
    });
});
