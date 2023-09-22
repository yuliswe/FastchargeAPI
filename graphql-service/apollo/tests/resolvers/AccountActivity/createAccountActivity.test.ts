import { RequestContext, createDefaultContextBatched } from "@/RequestContext";

import { AccountActivityReason, AccountActivityType } from "@/__generated__/resolvers-types";
import { User } from "@/database/models";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { getAdminUser, getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

let testUser: User;

beforeEach(async () => {
    testUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
});

const createAccountActivityMutation = graphql(`
    mutation TestCreateAccountActivity(
        $user: ID!
        $type: AccountActivityType!
        $reason: AccountActivityReason!
        $amount: NonNegativeDecimal!
        $description: String!
        $settleAt: Timestamp
    ) {
        createAccountActivity(
            user: $user
            type: $type
            reason: $reason
            amount: $amount
            description: $description
            settleAt: $settleAt
        ) {
            pk
            user {
                pk
            }
            type
            reason
            amount
            description
            settleAt
        }
    }
`);

function accountActivityProps() {
    return {
        user: UserPK.stringify(testUser),
        type: AccountActivityType.Debit,
        reason: AccountActivityReason.ApiMinMonthlyCharge,
        amount: "0",
        description: "test description",
        settleAt: Date.now(),
    };
}

describe("createAccountActivity", () => {
    test("Admin user can create account activity", async () => {
        const promise = testGQLClient({ user: await getAdminUser(context) }).mutate({
            mutation: createAccountActivityMutation,
            variables: accountActivityProps(),
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                createAccountActivity: {
                    __typename: "AccountActivity",
                    pk: expect.any(String),
                    amount: "0",
                    description: "test description",
                    reason: "api_min_monthly_charge",
                    settleAt: expect.any(Number),
                    type: "debit",
                    user: {
                        __typename: "User",
                        pk: UserPK.stringify(testUser),
                    },
                },
            },
        });
    });

    test("Only admin can create account activity", async () => {
        const promise = testGQLClient({ user: testUser }).mutate({
            mutation: createAccountActivityMutation,
            variables: accountActivityProps(),
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "createAccountActivity",
            },
        ]);
    });
});
