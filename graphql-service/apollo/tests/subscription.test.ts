import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { usageLogResolvers } from "../resolvers/usage";
import { collectUsageLogs as collectUsageSummary } from "../functions/usage";
import { AlreadyExists } from "../errors";
import { generateAccountActivities } from "../functions/billing";
import { Subscription, UsageLogModel, UsageSummaryModel, User } from "../dynamoose/models";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { UsageLogPK } from "../pks/UsageLogPK";
import { PricingPK } from "../pks/PricingPK";
import { settleAccountActivities } from "../functions/account";
import { UserPK } from "../pks/UserPK";
import Decimal from "decimal.js-light";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isSQSMessage: true,
    isServiceRequest: false,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Test when making a request the monthly subscription fee is charged.", () => {
    let user: User;
    test("Preparation: create a User", async () => {
        try {
            user = await context.batched.User.create({
                email: "testuser1.fastchargeapi@gmail.com",
            });
        } catch (e) {
            if (e instanceof AlreadyExists) {
                user = await context.batched.User.get({
                    email: "testuser1.fastchargeapi@gmail.com",
                });
            } else {
                throw e;
            }
        }
        expect(user).not.toBe(null);
    });

    test("Preparation: create an App", async () => {
        try {
            let app = await context.batched.App.create({
                name: "myapp",
                owner: user.email,
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
        let pricingRequirement = {
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
        let sub = await context.batched.Subscription.getOrNull({
            subscriber: UserPK.stringify(user),
        });
        if (subscription === null) {
            subscription = await context.batched.Subscription.create({
                subscriber: UserPK.stringify(user),
                pricing: pricingPK,
            });
        } else {
            subscription = sub!;
            subscription.pricing = pricingPK;
            await subscription.save();
        }
    });

    let usageLogPK: string;
    test("Preparation: create 3 UsageLogs", async () => {
        for (let i = 0; i < 3; i++) {
            let usageLog = (await usageLogResolvers.Mutation!.createUsageLog!(
                {},
                {
                    subscriber: "testuser1.fastchargeapi@gmail.com",
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
            // console.log(usageLog);
        }
    });

    let usageSummaryPK: string;
    test("Create a UsageSummary", async () => {
        let { affectedUsageSummaries } = await collectUsageSummary(context, {
            user: "testuser1.fastchargeapi@gmail.com",
            app: "myapp",
        });
        let usageSummary = affectedUsageSummaries[0];
        let usageLog = await UsageLogModel.get(UsageLogPK.parse(usageLogPK));
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
        let usageSummary = await UsageSummaryModel.get(UsageSummaryPK.parse(usageSummaryPK));
        let result = await generateAccountActivities(context, {
            usageSummary,
            subscriber: "testuser1.fastchargeapi@gmail.com",
            appAuthor: "testuser1.fastchargeapi@gmail.com",
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

        let now = Date.now();
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
        let result = await settleAccountActivities(context, "testuser1.fastchargeapi@gmail.com");
        expect(result).not.toBeNull();
        let { newAccountHistory, affectedAccountActivities, previousAccountHistory } = result!;
        expect(affectedAccountActivities.length).toEqual(4);
        expect(newAccountHistory.startingTime).toEqual(previousAccountHistory!.closingTime);
        expect(new Decimal(newAccountHistory.closingBalance).toString()).toEqual(
            new Decimal(previousAccountHistory!.closingBalance).sub("1.0003").toString()
        );
    });
});
