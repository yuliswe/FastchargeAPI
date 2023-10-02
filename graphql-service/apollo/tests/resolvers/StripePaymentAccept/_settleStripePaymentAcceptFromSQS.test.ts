import { StripePaymentAcceptStatus } from "@/__generated__/gql/graphql";
import { StripePaymentAccept } from "@/database/models/StripePaymentAccept";
import { User } from "@/database/models/User";
import { getDedupIdForSettleStripePaymentAcceptSQS } from "@/functions/payment";
import { StripePaymentAcceptPK } from "@/pks/StripePaymentAccept";
import { UserPK } from "@/pks/UserPK";
import { SQSQueueName } from "@/sqsClient";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    getUserBalanceNoCache,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { testGQLClient, testGQLClientForSQS } from "@/tests/testGQLClient";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("_settleStripePaymentAcceptFromSQS", () => {
    const settlePaymentMutation = graphql(`
        mutation TestSettleStripePaymentAccept($pk: ID!) {
            getStripePaymentAccept(pk: $pk) {
                _settleStripePaymentAcceptFromSQS {
                    pk
                    status
                    amount
                }
            }
        }
    `);

    let testOwnerUser: User;
    let testStripePaymentAccept: StripePaymentAccept;

    beforeEach(async () => {
        testOwnerUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testStripePaymentAccept = await context.batched.StripePaymentAccept.create({
            user: UserPK.stringify(testOwnerUser),
            amount: "1",
            stripePaymentStatus: "stripePaymentStatus",
            stripePaymentIntent: "stripePaymentIntent",
            stripeSessionId: "stripeSessionId-" + uuid.v4(),
            stripeSessionObject: {},
        });
    });

    function getExpectedStripePaymentAccept() {
        return {
            data: {
                getStripePaymentAccept: {
                    _settleStripePaymentAcceptFromSQS: {
                        __typename: "StripePaymentAccept",
                        pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
                        status: StripePaymentAcceptStatus.Settled,
                        amount: "1",
                    },
                },
            },
        };
    }

    test("Completes settleStripePaymentAccept succesfully", async () => {
        const promise = testGQLClientForSQS({
            queueName: SQSQueueName.BillingQueue,
            groupId: UserPK.stringify(testOwnerUser),
            dedupId: getDedupIdForSettleStripePaymentAcceptSQS(testStripePaymentAccept),
        }).mutate({
            mutation: settlePaymentMutation,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
    });

    test("Must be called on SQS", async () => {
        const promise = testGQLClient({ isServiceRequest: true }).mutate({
            mutation: settlePaymentMutation,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "NOT_ACCEPTED",
                message: "Must be called from SQS",
                path: "getStripePaymentAccept._settleStripePaymentAcceptFromSQS",
            },
        ]);
    });

    test("Should update user account balance", async () => {
        const oldBalance = await getUserBalanceNoCache(context, testOwnerUser);
        expect(oldBalance).toBe("0");
        const promise = testGQLClientForSQS({
            queueName: SQSQueueName.BillingQueue,
            groupId: UserPK.stringify(testOwnerUser),
            dedupId: getDedupIdForSettleStripePaymentAcceptSQS(testStripePaymentAccept),
        }).mutate({
            mutation: settlePaymentMutation,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
        const newBalance = await getUserBalanceNoCache(context, testOwnerUser);
        expect(newBalance).toBe("1");
    });

    test("Must be called on the Billing Queue", async () => {
        const promise = testGQLClientForSQS({
            queueName: SQSQueueName.UsageLogQueue,
            groupId: UserPK.stringify(testOwnerUser),
            dedupId: getDedupIdForSettleStripePaymentAcceptSQS(testStripePaymentAccept),
        }).mutate({
            mutation: settlePaymentMutation,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "NOT_ACCEPTED",
                message: expect.stringContaining("Must be called on SQS with QueueUrl = "),
                path: "getStripePaymentAccept._settleStripePaymentAcceptFromSQS",
            },
        ]);
    });

    test("SQS group ID is required", async () => {
        const promise = testGQLClientForSQS({
            queueName: SQSQueueName.BillingQueue,
            dedupId: getDedupIdForSettleStripePaymentAcceptSQS(testStripePaymentAccept),
        }).mutate({
            mutation: settlePaymentMutation,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "NOT_ACCEPTED",
                message: expect.stringContaining("Must be called on SQS with MessageGroupId = "),
                path: "getStripePaymentAccept._settleStripePaymentAcceptFromSQS",
            },
        ]);
    });

    test("Dedup ID is required", async () => {
        const promise = testGQLClientForSQS({
            queueName: SQSQueueName.BillingQueue,
            groupId: UserPK.stringify(testOwnerUser),
        }).mutate({
            mutation: settlePaymentMutation,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "NOT_ACCEPTED",
                message: expect.stringContaining("Must be called on SQS with MessageDeduplicationId = "),
                path: "getStripePaymentAccept._settleStripePaymentAcceptFromSQS",
            },
        ]);
    });

    test("Using a wrong SQS group ID should fail", async () => {
        const promise = testGQLClientForSQS({
            queueName: SQSQueueName.BillingQueue,
            groupId: "XXXX",
            dedupId: getDedupIdForSettleStripePaymentAcceptSQS(testStripePaymentAccept),
        }).mutate({
            mutation: settlePaymentMutation,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "NOT_ACCEPTED",
                message: expect.stringContaining("Must be called on SQS with MessageGroupId = "),
                path: "getStripePaymentAccept._settleStripePaymentAcceptFromSQS",
            },
        ]);
    });

    test("Using a wrong dedup ID should fail", async () => {
        const promise = testGQLClientForSQS({
            queueName: SQSQueueName.BillingQueue,
            groupId: UserPK.stringify(testOwnerUser),
            dedupId: "XXX",
        }).mutate({
            mutation: settlePaymentMutation,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "NOT_ACCEPTED",
                message: expect.stringContaining("Must be called on SQS with MessageDeduplicationId = "),
                path: "getStripePaymentAccept._settleStripePaymentAcceptFromSQS",
            },
        ]);
    });
});
