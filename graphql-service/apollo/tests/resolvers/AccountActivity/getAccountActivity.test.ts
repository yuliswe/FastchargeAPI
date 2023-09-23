import { RequestContext, createDefaultContextBatched } from "@/RequestContext";

import { AccountActivityReason, AccountActivityType } from "@/__generated__/resolvers-types";
import { AccountActivity } from "@/database/models/AccountActivity";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { Can } from "@/permissions";
import { AccountActivityPK } from "@/pks/AccountActivityPK";
import { AppPK } from "@/pks/AppPK";
import { StripeTransferPK } from "@/pks/StripeTransferPK";
import { UsageSummaryPK } from "@/pks/UsageSummaryPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { getOrCreateTestUser, simplifyGraphQLPromiseRejection, sortGraphQLErrors } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

let testAccountOwner: User;
let testOtherUser: User;
let testApp: App;
let testAccountActivity: AccountActivity;

beforeEach(async () => {
    const testAppName = `testapp-${uuidv4()}`;
    const testAccountOwnerEmail = `testuser_appowner_${uuidv4()}@gmail_mock.com`;
    const testOtherUserEmail = `testuser_otheruser_${uuidv4()}@gmail_mock.com`;
    testAccountOwner = await getOrCreateTestUser(context, { email: testAccountOwnerEmail });
    testOtherUser = await getOrCreateTestUser(context, { email: testOtherUserEmail });
    testApp = await context.batched.App.getOrCreate({ name: testAppName, owner: UserPK.stringify(testAccountOwner) });
    testAccountActivity = await context.batched.AccountActivity.create({
        user: UserPK.stringify(testAccountOwner),
        type: AccountActivityType.Debit,
        reason: AccountActivityReason.ApiMinMonthlyCharge,
        settleAt: Date.now(),
        amount: "0",
        billedApp: AppPK.stringify(testApp),
        usageSummary: UsageSummaryPK.stringify({
            subscriber: UserPK.stringify(testAccountOwner),
            createdAt: Date.now(),
        }),
        stripeTransfer: StripeTransferPK.stringify({
            receiver: UserPK.stringify(testAccountOwner),
            createdAt: Date.now(),
        }),
    });
});

const queryAccountActivity = graphql(`
    query GetAccountActivityByUser($pk: ID) {
        accountActivity(pk: $pk) {
            pk
            createdAt
            amount
            type
            reason
            description
            status
            settleAt
            consumedFreeQuota
            user {
                pk
            }
            billedApp {
                pk
            }
            usageSummary {
                pk
            }
            stripeTransfer {
                pk
            }
        }
    }
`);

const privateAccountActivityFields = [
    "pk",
    "createdAt",
    "amount",
    "type",
    "reason",
    "description",
    "status",
    "settleAt",
    "consumedFreeQuota",
    "user",
    "billedApp",
    "usageSummary",
    "stripeTransfer",
];

describe("query AccountActivity", () => {
    test("Account owner can read account activity", async () => {
        const result = await testGQLClient({ user: testAccountOwner }).query({
            query: queryAccountActivity,
            variables: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
        expect(result.data).toMatchObject({
            accountActivity: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
    });

    test("Other user cannot query account activity", async () => {
        const promise = testGQLClient({ user: testOtherUser }).query({
            query: queryAccountActivity,
            variables: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                path: "accountActivity",
            },
        ]);
    });

    test("Other user cannot read properties of account activity", async () => {
        jest.spyOn(Can, "queryAccountActivity").mockImplementation(() => Promise.resolve(true));
        const promise = testGQLClient({ user: testOtherUser }).query({
            query: queryAccountActivity,
            variables: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject(
            sortGraphQLErrors(
                privateAccountActivityFields.map((f) => ({
                    code: "PERMISSION_DENIED",
                    message: "You do not have permission to perform this action.",
                    path: `accountActivity.${f}`,
                }))
            )
        );
    });

    test("Query without pk", async () => {
        const promise = testGQLClient({ user: testOtherUser }).query({
            query: queryAccountActivity,
            variables: {},
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "BAD_USER_INPUT",
                path: "accountActivity",
            },
        ]);
    });

    test("Reading nullable properties does not crash", async () => {
        testAccountActivity = await context.batched.AccountActivity.updateWithNull(testAccountActivity, {
            stripeTransfer: null,
            usageSummary: null,
            billedApp: null,
        });
        const result = await testGQLClient({ user: testAccountOwner }).query({
            query: queryAccountActivity,
            variables: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
        expect(result.data).toMatchObject({
            accountActivity: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
    });
});
