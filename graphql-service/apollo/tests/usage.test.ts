import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { usageLogResolvers } from "../resolvers/usage";
import { collectUsageLogs as collectUsageSummary } from "../functions/usage";
import { AlreadyExists } from "../errors";
import { generateAccountActivities } from "../functions/billing";
import { App, Pricing, UsageLogModel, UsageSummaryModel, User } from "../dynamoose/models";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { UsageLogPK } from "../pks/UsageLogPK";
import { PricingPK } from "../pks/PricingPK";
import { settleAccountActivities } from "../functions/account";
import Decimal from "decimal.js-light";
import { UserPK } from "../pks/UserPK";
import { v4 as uuidv4 } from "uuid";
import { getOrCreateTestUser } from "./test-utils";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
};

describe("Usage API", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppName = `testapp-${uuidv4()}`;
    let testUser: User;
    let testApp: App;

    test("Prepare: Create test user and test app", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
        testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testUser) });
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
        const pricingls = await context.batched.Pricing.many({
            name: "default",
            app: "myapp",
            minMonthlyCharge: "0.001",
            chargePerRequest: "0.001",
        });
        let pricing: Pricing;
        if (pricingls.length > 0) {
            pricing = pricingls[0];
        } else {
            pricing = await context.batched.Pricing.create({
                name: "default",
                app: "myapp",
                minMonthlyCharge: "0.001",
                chargePerRequest: "0.001",
            });
        }
        pricingPK = PricingPK.stringify(pricing);
    });

    let usageLogPK: string;

    test("Preparation: create 3 UsageLogs", async () => {
        for (let i = 0; i < 3; i++) {
            const usageLog = (await usageLogResolvers.Mutation!.createUsageLog!(
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
            // console.log(usageLog);
        }
    });

    let usageSummaryPK: string;
    test("Test: Create a UsageSummary", async () => {
        const { affectedUsageSummaries } = await collectUsageSummary(context, {
            user: UserPK.stringify(testUser),
            app: "myapp",
        });
        const usageSummary = affectedUsageSummaries[0];
        const usageLog = await UsageLogModel.get(UsageLogPK.parse(usageLogPK));
        expect(usageSummary).not.toBeNull();
        expect(usageSummary.numberOfLogs).toEqual(3);
        expect(usageLog.status).toEqual("collected");
        expect(usageLog.usageSummary).toEqual(UsageSummaryPK.stringify(usageSummary));
        usageSummaryPK = UsageSummaryPK.stringify(usageSummary);
    });

    test("Test: Create AccountActivity", async () => {
        const usageSummary = await UsageSummaryModel.get(UsageSummaryPK.parse(usageSummaryPK));
        const result = await generateAccountActivities(context, {
            usageSummary,
            subscriber: UserPK.stringify(testUser),
            appAuthor: UserPK.stringify(testUser),
            disableMonthlyCharge: true,
        });
        expect(result.createdAccountActivities.appAuthorRequestFee.amount).toEqual("0.003");
        expect(result.createdAccountActivities.appAuthorRequestFee.type).toEqual("debit");
        expect(result.createdAccountActivities.subscriberRequestFee.amount).toEqual("0.003");
        expect(result.createdAccountActivities.subscriberRequestFee.type).toEqual("credit");
        expect(result.createdAccountActivities.appAuthorServiceFee.amount).toEqual("0.0003");
        expect(result.createdAccountActivities.appAuthorServiceFee.type).toEqual("credit");
    });

    test("Test: Create AccountHistory for API caller", async () => {
        const result = await settleAccountActivities(context, UserPK.stringify(testUser));
        expect(result).not.toBeNull();
        const { newAccountHistory, affectedAccountActivities, previousAccountHistory } = result!;
        expect(affectedAccountActivities.length).toEqual(3);
        if (previousAccountHistory) {
            expect(newAccountHistory.startingTime).toEqual(previousAccountHistory.closingTime);
            expect(new Decimal(newAccountHistory.closingBalance).toString()).toEqual(
                new Decimal(previousAccountHistory.closingBalance).sub("0.0003").toString()
            );
        } else {
            expect(newAccountHistory.startingTime).toEqual(0);
            expect(new Decimal(newAccountHistory.closingBalance).toString()).toEqual("-0.0003");
        }
    });
});
