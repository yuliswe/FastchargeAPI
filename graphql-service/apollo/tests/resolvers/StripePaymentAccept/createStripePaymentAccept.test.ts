import { User } from "@/database/models/User";
import { UserPK } from "@/pks/UserPK";
import { SQSQueueName } from "@/sqsClient";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { testGQLClient, testGQLClientForSQS } from "@/tests/testGQLClient";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("createStripePaymentAccept", () => {
    const createStripePaymentAcceptMutation = graphql(`
        mutation TestCreateStripePaymentAccept(
            $user: ID!
            $amount: NonNegativeDecimal!
            $stripePaymentStatus: String!
            $stripePaymentIntent: String!
            $stripeSessionId: String!
            $stripeSessionObject: String!
        ) {
            createStripePaymentAccept(
                user: $user
                amount: $amount
                stripePaymentStatus: $stripePaymentStatus
                stripePaymentIntent: $stripePaymentIntent
                stripeSessionId: $stripeSessionId
                stripeSessionObject: $stripeSessionObject
            ) {
                pk
                user {
                    pk
                }
                amount
                currency
                stripePaymentStatus
                stripeSessionId
                stripePaymentIntent
                stripeSessionObject
                createdAt
                updatedAt
            }
        }
    `);

    let testOwnerUser: User;
    beforeEach(async () => {
        testOwnerUser = await getOrCreateTestUser(context, { email: "testuser" });
    });

    test("Service user can create StripePaymentAccept", async () => {
        const variables = {
            user: UserPK.stringify(testOwnerUser),
            amount: "1",
            stripePaymentStatus: "stripePaymentStatus",
            stripePaymentIntent: "stripePaymentIntent",
            stripeSessionId: "stripeSessionId-" + uuid.v4(),
            stripeSessionObject: "{}",
        };
        const promise = testGQLClientForSQS({ queueName: SQSQueueName.BillingQueue }).mutate({
            mutation: createStripePaymentAcceptMutation,
            variables,
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                createStripePaymentAccept: {
                    pk: expect.any(String),
                    user: {
                        pk: UserPK.stringify(testOwnerUser),
                    },
                    amount: "1",
                    currency: "usd",
                    stripePaymentStatus: "stripePaymentStatus",
                    stripeSessionId: variables.stripeSessionId,
                    stripePaymentIntent: "stripePaymentIntent",
                    stripeSessionObject: "{}",
                    createdAt: expect.any(Number),
                    updatedAt: expect.any(Number),
                },
            },
        });
    });

    test("Other user cannot create StripePaymentAccept", async () => {
        const promise = testGQLClient({ user: testOwnerUser }).mutate({
            mutation: createStripePaymentAcceptMutation,
            variables: {
                user: UserPK.stringify(testOwnerUser),
                amount: "1",
                stripePaymentStatus: "stripePaymentStatus",
                stripePaymentIntent: "stripePaymentIntent",
                stripeSessionId: "stripeSessionId-" + uuid.v4(),
                stripeSessionObject: "{}",
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "createStripePaymentAccept",
            },
        ]);
    });

    // test("Can only be called from payment-service", async () => {
    //     const promise = testGQLClient({ isServiceRequest: true }).mutate({
    //         mutation: createStripePaymentAcceptMutation,
    //         variables: {
    //             user: UserPK.stringify(testUser),
    //             amount: "1",
    //             stripePaymentStatus: "stripePaymentStatus",
    //             stripePaymentIntent: "stripePaymentIntent",
    //             stripeSessionId: "stripeSessionId-" + uuid.v4(),
    //             stripeSessionObject: "{}",
    //         },
    //     });
    //     await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
    //         {
    //             code: "NOT_ACCEPTED",
    //             message: "createStripePaymentAccept can only be called from SQS.",
    //             path: "createStripePaymentAccept",
    //         },
    //     ]);
    // });

    test("Prevent duplication by stripeSessionId", async () => {
        const stripeSessionId = "stripeSessionId-" + uuid.v4();
        await context.batched.StripePaymentAccept.create({
            user: UserPK.stringify(testOwnerUser),
            amount: "1",
            stripeSessionId,
            stripeSessionObject: {},
            stripePaymentIntent: "stripePaymentIntent",
            stripePaymentStatus: "stripePaymentStatus",
        });
        const promise = testGQLClientForSQS({ queueName: SQSQueueName.BillingQueue }).mutate({
            mutation: createStripePaymentAcceptMutation,
            variables: {
                user: UserPK.stringify(testOwnerUser),
                amount: "1",
                stripePaymentStatus: "stripePaymentStatus",
                stripePaymentIntent: "stripePaymentIntent",
                stripeSessionId,
                stripeSessionObject: "{}",
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "ALREADY_EXISTS",
                message: expect.stringContaining("StripePaymentAccept already exists"),
                path: "createStripePaymentAccept",
            },
        ]);
    });
});
