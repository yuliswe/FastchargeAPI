import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { Can } from "@/permissions";
import { AppPK } from "@/pks/AppPK";
import { UserPK } from "@/pks/UserPK";
import { testGQLClient } from "@/tests/test-sql-client";
import { getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { graphql } from "@/typed-graphql";
import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

let testMainUser: User;
let testOtherUser: User;
let testApp: App;

beforeAll(async () => {
    testMainUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
    testOtherUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
    testApp = await context.batched.App.create({
        name: `testapp-${uuidv4()}`,
        owner: UserPK.stringify(testMainUser),
    });
});

const userPrivateFieldNames = [
    "pk",
    "email",
    "subscriptions",
    "createdAt",
    "updatedAt",
    "balance",
    "balanceLimit",
    "stripeCustomerId",
    "stripeConnectAccountId",
    "accountActivities",
    "accountHistories",
    "usageLogs",
    // "usageSummaries",
].sort((a, b) => a.localeCompare(b));

const queryUserByPK = graphql(`
    query GetUserByPK($pk: ID!) {
        getUser(pk: $pk) {
            pk
            email
            subscriptions {
                pk
            }
            createdAt
            updatedAt
            balance
            balanceLimit
            stripeCustomerId
            stripeConnectAccountId
            accountActivities {
                pk
            }
            accountHistories {
                pk
            }
            usageLogs {
                pk
            }
            author
            apps {
                pk
            }
        }
    }
`);

// usageSummaries (app: "${appPK}") { pk }
const queryUserByEmail = graphql(`
    query TestGetUserByEmail($email: Email!) {
        getUser(email: $email) {
            pk
        }
    }
`);

describe("Query User", () => {
    test("by pk", async () => {
        const result = await testGQLClient({ user: testMainUser }).query({
            query: queryUserByPK,
            variables: {
                pk: UserPK.stringify(testMainUser),
                // app: AppPK.stringify(testApp),
            },
        });
        expect(result.data?.getUser).toMatchObject({
            __typename: "User",
            pk: expect.stringContaining("user_"),
        });
    });

    test("by email", async () => {
        const result = await testGQLClient({ user: testMainUser }).query({
            query: queryUserByEmail,
            variables: {
                email: testMainUser.email,
            },
        });
        expect(result.data?.getUser).toMatchObject({
            __typename: "User",
            pk: expect.stringContaining("user_"),
        });
    });

    test("with no argument should fail", async () => {
        const query = graphql(`
            query GetUserWithNoArgument {
                getUser {
                    pk
                }
            }
        `);
        const promise = testGQLClient({ user: testOtherUser }).query({
            query,
            variables: {},
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "BAD_USER_INPUT",
                message: "id or email required",
                path: "getUser",
            },
        ]);
    });

    test("A user cannot be queried by another user", async () => {
        const promise = testGQLClient({ user: testOtherUser }).query({
            query: queryUserByPK,
            variables: {
                pk: UserPK.stringify(testMainUser),
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getUser",
            },
        ]);
    });

    test("User fields that are hidden from public", async () => {
        jest.spyOn(Can, "queryUser").mockImplementation(() => Promise.resolve(true));
        const promise = testGQLClient({ user: testOtherUser }).query({
            query: graphql(`
                query TestUserHiddenFields($pk: ID!) {
                    getUser(pk: $pk) {
                        pk
                        email
                        subscriptions {
                            pk
                        }
                        createdAt
                        updatedAt
                        balance
                        balanceLimit
                        stripeCustomerId
                        stripeConnectAccountId
                        accountActivities {
                            pk
                        }
                        accountHistories {
                            pk
                        }
                        usageLogs {
                            pk
                        }
                    }
                }
            `),
            variables: {
                pk: UserPK.stringify(testMainUser),
            },
        });

        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject(
            userPrivateFieldNames.map((p) => ({
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: `getUser.${p}`,
            }))
        );
    });

    test("User fields that are visible to public", async () => {
        jest.spyOn(Can, "queryUser").mockImplementation(() => Promise.resolve(true));
        const result = await testGQLClient({ user: testOtherUser }).query({
            query: graphql(`
                query TestUserPublicFields($pk: ID!) {
                    getUser(pk: $pk) {
                        author
                        apps {
                            pk
                        }
                    }
                }
            `),
            variables: {
                pk: UserPK.stringify(testMainUser),
            },
        });
        expect(result.data?.getUser).toMatchObject({
            __typename: "User",
            apps: [
                {
                    __typename: "App",
                    pk: AppPK.stringify(testApp),
                },
            ],
            author: testMainUser.author,
        });
    });
});
