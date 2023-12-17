import { User } from "@/database/models/User";
import { UserPK } from "@/pks/UserPK";
import { StripePaymentAcceptResolvers } from "@/resolvers/StripePaymentAccept";
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const _sqsSettleStripePaymentAcceptSpy = () =>
    jest.spyOn(StripePaymentAcceptResolvers.StripePaymentAccept, "_sqsSettleStripePaymentAccept");

describe("createStripePaymentAccept", () => {
    const createStripePaymentAcceptMutation = graphql(`
        mutation TestCreateStripePaymentAccept(
            $user: ID!
            $amount: NonNegativeDecimal!
            $stripePaymentStatus: String!
            $stripePaymentIntent: String!
            $stripeSessionId: String!
            $stripeSessionObject: String!
            $settleImmediately: Boolean!
        ) {
            createStripePaymentAccept(
                user: $user
                amount: $amount
                stripePaymentStatus: $stripePaymentStatus
                stripePaymentIntent: $stripePaymentIntent
                stripeSessionId: $stripeSessionId
                stripeSessionObject: $stripeSessionObject
                settleImmediately: $settleImmediately
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

    function getVariables() {
        return {
            user: UserPK.stringify(testOwnerUser),
            amount: "1",
            stripePaymentStatus: "stripePaymentStatus",
            stripePaymentIntent: "stripePaymentIntent",
            stripeSessionId: "stripeSessionId-" + uuid.v4(),
            stripeSessionObject: "{}",
            settleImmediately: true,
        };
    }

    function getExpected(overwrite?: { stripeSessionId: string }) {
        const { stripeSessionId } = overwrite ?? {};
        return {
            data: {
                createStripePaymentAccept: {
                    pk: expect.any(String),
                    user: {
                        pk: UserPK.stringify(testOwnerUser),
                    },
                    amount: "1",
                    currency: "usd",
                    stripePaymentStatus: "stripePaymentStatus",
                    stripeSessionId: stripeSessionId ?? expect.stringContaining("stripeSessionId-"),
                    stripePaymentIntent: "stripePaymentIntent",
                    stripeSessionObject: "{}",
                    createdAt: expect.any(Number),
                    updatedAt: expect.any(Number),
                },
            },
        };
    }

    test("Service user can create StripePaymentAccept", async () => {
        const variables = getVariables();
        const { stripeSessionId } = variables;
        const promise = getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: createStripePaymentAcceptMutation,
            variables,
        });
        await expect(promise).resolves.toMatchObject(getExpected({ stripeSessionId }));
    });

    test("Other user cannot create StripePaymentAccept", async () => {
        const promise = getTestGQLClient({ user: testOwnerUser }).mutate({
            mutation: createStripePaymentAcceptMutation,
            variables: getVariables(),
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "createStripePaymentAccept",
            },
        ]);
    });

    test("createStripePaymentAccept with settleImmediately = true should call _sqsSettleStripePaymentAccept", async () => {
        const _sqsSettleStripePaymentAccept = _sqsSettleStripePaymentAcceptSpy();
        await getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: createStripePaymentAcceptMutation,
            variables: {
                ...getVariables(),
                settleImmediately: true,
            },
        });
        expect(_sqsSettleStripePaymentAccept).toHaveBeenCalledTimes(1);
    });

    test("createStripePaymentAccept with settleImmediately = false should not call _sqsSettleStripePaymentAccept", async () => {
        const _sqsSettleStripePaymentAccept = _sqsSettleStripePaymentAcceptSpy();
        await getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: createStripePaymentAcceptMutation,
            variables: {
                ...getVariables(),
                settleImmediately: false,
            },
        });
        expect(_sqsSettleStripePaymentAccept).toHaveBeenCalledTimes(0);
    });

    test("Prevent duplication by stripeSessionId", async () => {
        const variables = { ...getVariables(), stripeSessionId: "stripeSessionId-" + uuid.v4() };
        // create first
        await context.batched.StripePaymentAccept.create({
            user: UserPK.stringify(testOwnerUser),
            amount: "1",
            stripeSessionId: variables.stripeSessionId, // same stripeSessionId
            stripeSessionObject: {},
            stripePaymentIntent: "stripePaymentIntent",
            stripePaymentStatus: "stripePaymentStatus",
        });
        // create duplicated
        const promise = getTestGQLClient({ isServiceRequest: true }).mutate({
            mutation: createStripePaymentAcceptMutation,
            variables,
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
