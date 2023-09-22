import { AccountHistory, User } from "@/database/models";
import { AccountHistoryPK } from "@/pks/AccountHistoryPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { baseRequestContext, getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context = baseRequestContext;

let testOwnerUser: User;
let testOtherOwner: User;
let testAccountHistory: AccountHistory;
beforeAll(async () => {
    testOwnerUser = await getOrCreateTestUser(context, {
        email: `testOwnerUser_${uuidv4()}@gmail_mock.com`,
    });
    testOtherOwner = await getOrCreateTestUser(context, {
        email: `testOtherOwner_${uuidv4()}@gmail_mock.com`,
    });
    testAccountHistory = await context.batched.AccountHistory.getOrCreate({
        user: UserPK.stringify(testOwnerUser),
        sequentialId: 0,
        startingTime: 0,
        startingBalance: "0",
        closingTime: 0,
        closingBalance: "123",
    });
});

const listAccountHistoryByUserQuery = graphql(`
    query TestlistAccountHistoryByUser($user: ID!) {
        listAccountHistoryByUser(user: $user) {
            pk
            user {
                pk
            }
            startingTime
            startingBalance
            closingTime
            closingBalance
        }
    }
`);

describe("listAccountHistoryByUser", () => {
    test("Anyone can list their own account history", async () => {
        const promise = testGQLClient({ user: testOwnerUser }).query({
            query: listAccountHistoryByUserQuery,
            variables: {
                user: UserPK.stringify(testOwnerUser),
            },
        });
        const { startingTime, closingTime, startingBalance, closingBalance } = testAccountHistory;
        await expect(promise).resolves.toMatchObject({
            data: {
                listAccountHistoryByUser: [
                    {
                        pk: AccountHistoryPK.stringify(testAccountHistory),
                        user: {
                            pk: UserPK.stringify(testOwnerUser),
                        },
                        startingTime,
                        startingBalance,
                        closingTime,
                        closingBalance,
                    },
                ],
            },
        });
    });

    test("User can only list their own account history", async () => {
        const promise = testGQLClient({ user: testOtherOwner }).query({
            query: listAccountHistoryByUserQuery,
            variables: {
                user: UserPK.stringify(testOwnerUser),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "listAccountHistoryByUser",
            },
        ]);
    });
});
