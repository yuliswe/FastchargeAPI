import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { GatewayMode, User } from "../dynamoose/models";
import { appResolvers } from "../resolvers/app";
import { GQLUserIndex } from "../__generated__/resolvers-types";
import { UserPK } from "../pks/UserPK";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
};
// jest.retryTimes(2);

describe("Clean up everything", () => {
    let user: User;
    test("Preparation: get test user 1", async () => {
        user = await context.batched.User.get(
            { email: "testuser1.fastchargeapi@gmail.com" },
            { using: GQLUserIndex.IndexByEmailOnlyPk }
        );
        expect(user).not.toBe(null);
    });

    it("Delete all AccountHistories", async () => {
        let deleted = await context.batched.AccountHistory.deleteMany({
            user: UserPK.stringify(user),
        });
        console.log("deleted", deleted.length);
    });

    it("Delete all AccountActivities", async () => {
        let deleted = await context.batched.AccountActivity.deleteMany({
            user: UserPK.stringify(user),
        });
        console.log("deleted", deleted.length);
    });

    it("Delete all UsageSummaries", async () => {
        let deleted = await context.batched.UsageSummary.deleteMany({
            subscriber: UserPK.stringify(user),
        });
        console.log("deleted", deleted.length);
    });

    it("Delete all UsageLogs", async () => {
        let deleted = await context.batched.UsageLog.deleteMany({
            subscriber: UserPK.stringify(user),
        });
        console.log("deleted", deleted.length);
    });
});
