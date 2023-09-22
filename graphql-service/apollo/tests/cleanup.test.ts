import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { User, UserIndex } from "../database/models";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

const testUser = "testuser1.fastchargeapi@gmail.com";
// jest.retryTimes(2);
describe.skip("Clean up everything", () => {
    let user: User;
    test("Preparation: get test user 1", async () => {
        user = await context.batched.User.get({ email: testUser }, { using: UserIndex.IndexByEmailOnlyPk });
        expect(user).not.toBe(null);
    });

    test("Delete all AccountHistories", async () => {
        const deleted = await context.batched.AccountHistory.deleteMany({
            user: testUser,
        });
        console.log("deleted", deleted.length);
    });

    test("Delete all AccountActivities", async () => {
        const deleted = await context.batched.AccountActivity.deleteMany({
            user: testUser,
        });
        console.log("deleted", deleted.length);
    });

    test("Delete all UsageSummaries", async () => {
        const deleted = await context.batched.UsageSummary.deleteMany({
            subscriber: testUser,
        });
        console.log("deleted", deleted.length);
    });

    test("Delete all UsageLogs", async () => {
        const deleted = await context.batched.UsageLog.deleteMany({
            subscriber: testUser,
        });
        console.log("deleted", deleted.length);
    });
});
