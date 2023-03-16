import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { usageLogResolvers } from "../resolvers/usage";
import { collectUsageLogs as collectUsageSummary } from "../functions/usage";
import { AlreadyExists } from "../errors";
import { generateAccountActivities } from "../functions/billing";
import { Pricing, UsageLogModel, UsageSummaryModel, User } from "../dynamoose/models";
import { UsageSummaryPK } from "../pks/UsageSummaryPK";
import { UsageLogPK } from "../pks/UsageLogPK";
import { PricingPK } from "../pks/PricingPK";
import { settleAccountActivities } from "../functions/account";
import Decimal from "decimal.js-light";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: true,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Usage API", () => {
    let user: User;
    test("create a User", async () => {
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

    test("create an App", async () => {
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
    test("create a Pricing or use existing", async () => {
        let pricingls = await context.batched.Pricing.many({
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

    test("create 3 UsageLogs", async () => {
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

    test("Create AccountActivity", async () => {
        let usageSummary = await UsageSummaryModel.get(UsageSummaryPK.parse(usageSummaryPK));
        let result = await generateAccountActivities(context, {
            usageSummary,
            subscriber: "testuser1.fastchargeapi@gmail.com",
            appAuthor: "testuser1.fastchargeapi@gmail.com",
            disableMonthlyCharge: true,
        });
        expect(result.createdAccountActivities.appAuthorRequestFee.amount).toEqual("0.003");
        expect(result.createdAccountActivities.appAuthorRequestFee.type).toEqual("debit");
        expect(result.createdAccountActivities.subscriberRequestFee.amount).toEqual("0.003");
        expect(result.createdAccountActivities.subscriberRequestFee.type).toEqual("credit");
        expect(result.createdAccountActivities.appAuthorServiceFee.amount).toEqual("0.0003");
        expect(result.createdAccountActivities.appAuthorServiceFee.type).toEqual("credit");
    });

    test("Create AccountHistory for API caller", async () => {
        let result = await settleAccountActivities(context, "testuser1.fastchargeapi@gmail.com");
        expect(result).not.toBeNull();
        let { newAccountHistory, affectedAccountActivities, previousAccountHistory } = result!;
        expect(affectedAccountActivities.length).toEqual(3);
        expect(newAccountHistory.startingTime).toEqual(previousAccountHistory!.closingTime);
        expect(new Decimal(newAccountHistory.closingBalance).toString()).toEqual(
            new Decimal(previousAccountHistory!.closingBalance).sub("0.0003").toString()
        );
    });
});
