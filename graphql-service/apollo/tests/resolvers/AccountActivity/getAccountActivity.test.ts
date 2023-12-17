import { AccountActivityReason, AccountActivityType, StripeTransferStatus } from "@/__generated__/resolvers-types";
import { AccountActivity } from "@/database/models/AccountActivity";
import { App } from "@/database/models/App";
import { Pricing } from "@/database/models/Pricing";
import { StripeTransfer } from "@/database/models/StripeTransfer";
import { UsageSummary } from "@/database/models/UsageSummary";
import { User } from "@/database/models/User";
import { Can } from "@/permissions";
import { AccountActivityPK } from "@/pks/AccountActivityPK";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { StripeTransferPK } from "@/pks/StripeTransferPK";
import { UsageSummaryPK } from "@/pks/UsageSummaryPK";
import { UserPK } from "@/pks/UserPK";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
    sortGraphQLErrors,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

describe("query AccountActivity", () => {
    let testAccountOwner: User;
    let testOtherUser: User;
    let testApp: App;
    let testPricing: Pricing;
    let testAccountActivity: AccountActivity;
    let testUsageSummary: UsageSummary;
    let testStripeTransfer: StripeTransfer;

    beforeEach(async () => {
        const testAppName = `testapp-${uuidv4()}`;
        const testAccountOwnerEmail = `testuser_appowner_${uuidv4()}@gmail_mock.com`;
        const testOtherUserEmail = `testuser_otheruser_${uuidv4()}@gmail_mock.com`;
        testAccountOwner = await getOrCreateTestUser(context, { email: testAccountOwnerEmail });
        testOtherUser = await getOrCreateTestUser(context, { email: testOtherUserEmail });
        testApp = await context.batched.App.createOverwrite({
            name: testAppName,
            owner: UserPK.stringify(testAccountOwner),
        });
        testPricing = await context.batched.Pricing.create({
            app: AppPK.stringify(testApp),
            name: "Premium",
            minMonthlyCharge: "1",
            chargePerRequest: "0.001",
        });
        testUsageSummary = await context.batched.UsageSummary.create({
            subscriber: UserPK.stringify(testAccountOwner),
            app: AppPK.stringify(testApp),
            pricing: PricingPK.stringify(testPricing),
            numberOfLogs: 1,
        });
        testStripeTransfer = await context.batched.StripeTransfer.create({
            receiver: UserPK.stringify(testAccountOwner),
            receiveAmount: "0",
            withdrawAmount: "0",
            transferAt: Date.now(),
            status: StripeTransferStatus.Transferred,
        });
        testAccountActivity = await context.batched.AccountActivity.create({
            user: UserPK.stringify(testAccountOwner),
            type: AccountActivityType.Incoming,
            reason: AccountActivityReason.ApiMinMonthlyCharge,
            settleAt: Date.now(),
            amount: "0",
            billedApp: AppPK.stringify(testApp),
            usageSummary: UsageSummaryPK.stringify(testUsageSummary),
            stripeTransfer: StripeTransferPK.stringify(testStripeTransfer),
            consumedFreeQuota: 1,
        });
    });

    const getAccountActivityQuery = graphql(`
        query GetAccountActivityByUser($pk: ID!) {
            getAccountActivity(pk: $pk) {
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

    test("Account owner can read account activity", async () => {
        const result = await getTestGQLClient({ user: testAccountOwner }).query({
            query: getAccountActivityQuery,
            variables: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
        expect(result.data).toMatchObject({
            getAccountActivity: {
                pk: AccountActivityPK.stringify(testAccountActivity),
                createdAt: testAccountActivity.createdAt,
                amount: testAccountActivity.amount,
                type: testAccountActivity.type,
                reason: testAccountActivity.reason,
                description: testAccountActivity.description,
                status: testAccountActivity.status,
                settleAt: testAccountActivity.settleAt,
                consumedFreeQuota: testAccountActivity.consumedFreeQuota,
                user: {
                    pk: UserPK.stringify(testAccountOwner),
                },
                billedApp: {
                    pk: AppPK.stringify(testApp),
                },
                usageSummary: {
                    pk: UsageSummaryPK.stringify(testUsageSummary),
                },
                stripeTransfer: {
                    pk: StripeTransferPK.stringify(testStripeTransfer),
                },
            },
        });
    });

    test("Other user cannot query account activity", async () => {
        const promise = getTestGQLClient({ user: testOtherUser }).query({
            query: getAccountActivityQuery,
            variables: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                path: "getAccountActivity",
            },
        ]);
    });

    test("Other user cannot read properties of account activity", async () => {
        jest.spyOn(Can, "queryAccountActivity").mockImplementation(() => Promise.resolve(true));
        const promise = getTestGQLClient({ user: testOtherUser }).query({
            query: getAccountActivityQuery,
            variables: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject(
            sortGraphQLErrors(
                [
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
                ].map((f) => ({
                    code: "PERMISSION_DENIED",
                    message: "You do not have permission to perform this action.",
                    path: `getAccountActivity.${f}`,
                }))
            )
        );
    });

    test("Reading nullable properties does not crash", async () => {
        testAccountActivity = await context.batched.AccountActivity.updateWithNull(testAccountActivity, {
            stripeTransfer: null,
            usageSummary: null,
            billedApp: null,
        });
        const result = await getTestGQLClient({ user: testAccountOwner }).query({
            query: getAccountActivityQuery,
            variables: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
        expect(result.data).toMatchObject({
            getAccountActivity: {
                pk: AccountActivityPK.stringify(testAccountActivity),
            },
        });
    });
});
