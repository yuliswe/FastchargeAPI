import { StripeTransferStatus } from "@/__generated__/gql/graphql";
import { StripeTransfer } from "@/database/models/StripeTransfer";
import { User } from "@/database/models/User";
import { Can } from "@/permissions";
import { StripeTransferPK } from "@/pks/StripeTransferPK";
import { UserPK } from "@/pks/UserPK";
import {
    baseRequestContext as context,
    getAdminUser,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
    sortGraphQLErrors,
} from "@/tests/test-utils";
import { testGQLClient } from "@/tests/testGQLClient";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import * as uuid from "uuid";

describe("getStripeTransfer", () => {
    let testStripeTransfer: StripeTransfer;
    let testOwnerUser: User;
    let testOtherUser: User;
    beforeAll(async () => {
        testOwnerUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testOtherUser = await getOrCreateTestUser(context, { email: "testuser" + uuid.v4() });
        testStripeTransfer = await context.batched.StripeTransfer.create({
            receiver: UserPK.stringify(testOwnerUser),
            receiveAmount: "0",
            withdrawAmount: "0",
            transferAt: Date.now(),
            status: StripeTransferStatus.Transferred,
            stripeTransferId: "stripeTransferId",
            stripeTransferObject: {},
        });
    });

    const getStripeTransferQuery = graphql(`
        query TestGetStripeTransfer($pk: ID!) {
            getStripeTransfer(pk: $pk) {
                pk
                receiver {
                    pk
                }
                withdrawAmount
                receiveAmount
                stripeTransferId
                stripeTransferObject
                createdAt
                currency
                transferAt
                status
            }
        }
    `);

    function getExpectedStripePaymentAccept() {
        return {
            data: {
                getStripeTransfer: {
                    __typename: "StripeTransfer",
                    createdAt: expect.any(Number),
                    currency: "usd",
                    pk: StripeTransferPK.stringify(testStripeTransfer),
                    receiveAmount: "0",
                    status: "transferred",
                    stripeTransferId: "stripeTransferId",
                    stripeTransferObject: "{}",
                    transferAt: testStripeTransfer.transferAt,
                    withdrawAmount: "0",
                    receiver: {
                        __typename: "User",
                        pk: UserPK.stringify(testOwnerUser),
                    },
                },
            },
        };
    }

    test("Owner can get StripeTransfer", async () => {
        const promise = testGQLClient({ user: testOwnerUser }).query({
            query: getStripeTransferQuery,
            variables: {
                pk: StripeTransferPK.stringify(testStripeTransfer),
            },
        });

        await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
    });

    test("Admin can get StripeTransfer", async () => {
        const promise = testGQLClient({ user: await getAdminUser(context) }).query({
            query: getStripeTransferQuery,
            variables: {
                pk: StripeTransferPK.stringify(testStripeTransfer),
            },
        });

        await expect(promise).resolves.toMatchObject(getExpectedStripePaymentAccept());
    });

    test("Non-owner cannot get StripeTransfer", async () => {
        const promise = testGQLClient({ user: testOtherUser }).query({
            query: getStripeTransferQuery,
            variables: {
                pk: StripeTransferPK.stringify(testStripeTransfer),
            },
        });

        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getStripeTransfer",
            },
        ]);
    });

    test("Non-owner cannot get StripeTransfer private fields", async () => {
        jest.spyOn(Can, "getStripeTransfer").mockImplementation(() => Promise.resolve(true));

        const promise = testGQLClient({ user: testOtherUser }).query({
            query: getStripeTransferQuery,
            variables: {
                pk: StripeTransferPK.stringify(testStripeTransfer),
            },
        });

        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject(
            sortGraphQLErrors(
                [
                    "createdAt",
                    "currency",
                    "pk",
                    "receiveAmount",
                    "receiver",
                    "status",
                    "stripeTransferId",
                    "stripeTransferObject",
                    "transferAt",
                    "withdrawAmount",
                ].map((f) => ({
                    code: "PERMISSION_DENIED",
                    message: "You do not have permission to perform this action.",
                    path: `getStripeTransfer.${f}`,
                }))
            )
        );
    });
});
