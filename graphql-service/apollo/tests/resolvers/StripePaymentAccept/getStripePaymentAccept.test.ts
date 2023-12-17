import { StripePaymentAcceptStatus } from "@/__generated__/gql/graphql";
import { StripePaymentAccept } from "@/database/models/StripePaymentAccept";
import { User } from "@/database/models/User";
import { Can } from "@/permissions";
import { StripePaymentAcceptPK } from "@/pks/StripePaymentAccept";
import { UserPK } from "@/pks/UserPK";
import {
    baseRequestContext as context,
    getAdminUser,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
    sortGraphQLErrors,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import * as uuid from "uuid";

describe("getStripePaymentAccept", () => {
    const getStripePaymentAcceptQuery = graphql(`
        query TestGetStripePaymentAccept($pk: ID!) {
            getStripePaymentAccept(pk: $pk) {
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
                status
            }
        }
    `);

    let testOwnerUser: User;
    let testOtherUser: User;
    let testStripePaymentAccept: StripePaymentAccept;

    beforeEach(async () => {
        testOwnerUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
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
                    __typename: "StripePaymentAccept",
                    amount: "1",
                    currency: "usd",
                    pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
                    stripePaymentIntent: "stripePaymentIntent",
                    stripePaymentStatus: "stripePaymentStatus",
                    stripeSessionObject: "{}",
                    stripeSessionId: testStripePaymentAccept.stripeSessionId,
                    createdAt: testStripePaymentAccept.createdAt,
                    updatedAt: testStripePaymentAccept.updatedAt,
                    user: {
                        __typename: "User",
                        pk: UserPK.stringify(testOwnerUser),
                    },
                    status: StripePaymentAcceptStatus.Pending,
                },
            },
        };
    }

    test("Admin user can get StripePaymentAccept", async () => {
        const promise = getTestGQLClient({ user: await getAdminUser(context) }).query({
            query: getStripePaymentAcceptQuery,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
    });

    test("Service user can get StripePaymentAccept", async () => {
        const promise = getTestGQLClient({ isServiceRequest: true }).query({
            query: getStripePaymentAcceptQuery,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
    });

    test("Owner user can get StripePaymentAccept", async () => {
        const promise = getTestGQLClient({ user: testOwnerUser }).query({
            query: getStripePaymentAcceptQuery,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
    });

    test("Other user cannot get StripePaymentAccept", async () => {
        const promise = getTestGQLClient({ user: testOtherUser }).query({
            query: getStripePaymentAcceptQuery,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getStripePaymentAccept",
            },
        ]);
    });

    test("Other user cannot read properties of StripePaymentAccept", async () => {
        jest.spyOn(Can, "getStripePaymentAccept").mockImplementation(() => Promise.resolve(true));
        const promise = getTestGQLClient({ user: testOtherUser }).query({
            query: getStripePaymentAcceptQuery,
            variables: {
                pk: StripePaymentAcceptPK.stringify(testStripePaymentAccept),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject(
            sortGraphQLErrors(
                [
                    "pk",
                    "user",
                    "amount",
                    "currency",
                    "stripePaymentStatus",
                    "stripeSessionId",
                    "stripePaymentIntent",
                    "stripeSessionObject",
                    "createdAt",
                    "status",
                    "updatedAt",
                ].map((f) => ({
                    code: "PERMISSION_DENIED",
                    message: "You do not have permission to perform this action.",
                    path: `getStripePaymentAccept.${f}`,
                }))
            )
        );
    });
});
