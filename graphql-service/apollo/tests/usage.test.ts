import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { usageLogResolvers } from "../resolvers/usage";
import { collectUsageLogs as collectUsageSummary } from "../functions/usage";
import { AlreadyExists } from "../errors";
import { generateAccountActivities } from "../functions/billing";
import {
    PricingModel,
    UsageLogModel,
    UsageSummaryModel,
} from "../dynamoose/models";
import { UsageSummaryPK } from "../functions/UsageSummaryPK";
import { UsageLogPK } from "../functions/UsageLogPK";
import { PricingPK } from "../functions/PricingPK";
import { collectAccountActivities } from "../functions/account";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
};
// jest.retryTimes(2);
describe("Usage API", () => {
    test("create a User", async () => {
        try {
            let user = await context.batched.User.create({
                email: "testuser1.fastchargeapi@gmail.com",
            });
        } catch (e) {
            if (e instanceof AlreadyExists) {
                console.log("User already exists");
            } else {
                throw e;
            }
        }
    });
    test("create an App", async () => {
        try {
            let app = await context.batched.App.create({
                name: "myapp",
                owner: "testuser1.fastchargeapi@gmail.com",
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
        try {
            let pricing = await context.batched.Pricing.create({
                name: "default",
                app: "myapp",
                minMonthlyCharge: "0.001",
                chargePerRequest: "0.001",
            });
            pricingPK = PricingPK.stringify(pricing);
        } catch (e) {
            if (e instanceof AlreadyExists) {
                console.log("App already exists");
                let pricing = await context.batched.Pricing.many({
                    app: "myapp",
                    name: "default",
                })[0];
                pricingPK = PricingPK.stringify(pricing);
            } else {
                throw e;
            }
        }
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
        let usageSummary = await collectUsageSummary(context, {
            user: "testuser1.fastchargeapi@gmail.com",
            app: "myapp",
        });
        let usageLog = await UsageLogModel.get(UsageLogPK.parse(usageLogPK));
        expect(usageSummary).not.toBeNull();
        expect(usageSummary!.queueSize).toEqual(3);
        expect(usageLog.status).toEqual("collected");
        expect(usageLog.usageSummary).toEqual(
            UsageSummaryPK.stringify(usageSummary!)
        );
        usageSummaryPK = UsageSummaryPK.stringify(usageSummary!);
    });

    test("Create AccountActivity", async () => {
        let usageSummary = await UsageSummaryModel.get(
            UsageSummaryPK.parse(usageSummaryPK)
        );
        let pricing = await PricingModel.get(PricingPK.parse(pricingPK));
        expect(pricing.chargePerRequest).toEqual("0.001"); // made 3 UsageLogs, so the total amount is 0.003
        let result = await generateAccountActivities(context, {
            usageSummary,
            pricing,
            subscriber: "testuser1.fastchargeapi@gmail.com",
            appAuthor: "testuser1.fastchargeapi@gmail.com",
            disableMonthlyCharge: true,
        });
        expect((await result.appAuthorPerRequest).amount).toEqual("0.003");
        expect((await result.appAuthorPerRequest).type).toEqual("debit");
        expect((await result.subscriberPerRequest).amount).toEqual("0.003");
        expect((await result.subscriberPerRequest).type).toEqual("credit");
    });

    test("Create AccountHistory", async () => {
        let result = await collectAccountActivities(
            context,
            "testuser1.fastchargeapi@gmail.com"
        );
        expect(result).not.toBeNull();
        let {
            accountHistory,
            affectedAccountActivities: accountActivities,
            previousAccountHistory,
        } = result!;
        expect(accountActivities.length).toEqual(2);
        expect(accountHistory.startingTime).toEqual(
            previousAccountHistory!.closingTime
        );
        expect(Number.parseFloat(accountHistory.closingBalance)).toEqual(
            Number.parseFloat(previousAccountHistory!.closingBalance)
        );
    });
});
