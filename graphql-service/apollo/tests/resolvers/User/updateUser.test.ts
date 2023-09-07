import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { GQLStripePaymentAcceptStatus } from "@/__generated__/resolvers-types";
import { App, StripePaymentAccept, User, UserAppToken } from "@/database/models";
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
let testUserAppToken: UserAppToken;
let testStripePaymentAccept: StripePaymentAccept;

beforeAll(async () => {
    testMainUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
    testOtherUser = await getOrCreateTestUser(context, { email: `testuser_${uuidv4()}@gmail_mock.com` });
    testApp = await context.batched.App.create({
        name: `testapp-${uuidv4()}`,
        owner: UserPK.stringify(testMainUser),
    });
    testUserAppToken = await context.batched.UserAppToken.create({
        app: AppPK.stringify(testApp),
        createdAt: Date.now(),
        subscriber: UserPK.stringify(testMainUser),
        signature: uuidv4(),
    });
    testStripePaymentAccept = await context.batched.StripePaymentAccept.create({
        amount: "100",
        currency: "usd",
        stripePaymentStatus: GQLStripePaymentAcceptStatus.Pending,
        stripePaymentIntent: uuidv4(),
        stripeSessionId: uuidv4(),
        stripeSessionObject: {},
        user: UserPK.stringify(testMainUser),
    });
});

describe("udpate User", () => {
    test("User can update author name", async () => {
        const result = await testGQLClient({ user: testMainUser }).mutate({
            mutation: graphql(`
                query UpdateUserAuthorName($user: ID!, $newAuthorName: String!) {
                    getUser(pk: $user) {
                        updateUser(author: $newAuthorName) {
                            pk
                            author
                        }
                    }
                }
            `),
            variables: {
                user: UserPK.stringify(testMainUser),
                newAuthorName: "new name",
            },
        });
        expect(result.errors).toBeUndefined();
        expect(result.data?.getUser.updateUser).toMatchObject({
            pk: UserPK.stringify(testMainUser),
            author: "new name",
        });
    });

    test("User can only update their own name", async () => {
        // Assuming the user can query the user.
        jest.spyOn(Can, "queryUser").mockImplementationOnce((user, context) => Promise.resolve(true));
        const promise = testGQLClient({ user: testOtherUser }).mutate({
            mutation: graphql(`
                query UpdateUserAuthorName($user: ID!, $newAuthorName: String!) {
                    getUser(pk: $user) {
                        updateUser(author: $newAuthorName) {
                            pk
                            author
                        }
                    }
                }
            `),
            variables: {
                user: UserPK.stringify(testMainUser),
                newAuthorName: "new name",
            },
        });
        await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                path: "getUser.updateUser",
            },
        ]);
    });

    describe("Only service can update these fields:", () => {
        for (const field of ["stripeCustomerId", "stripeConnectAccountId"]) {
            test(`${field}`, async () => {
                const promise = testGQLClient({ user: testMainUser }).query({
                    query: graphql(`
                        query UpdateUser_ServiceOnly(
                            $user: ID!
                            $stripeCustomerId: String
                            $stripeConnectAccountId: String
                        ) {
                            getUser(pk: $user) {
                                updateUser(
                                    stripeCustomerId: $stripeCustomerId
                                    stripeConnectAccountId: $stripeConnectAccountId
                                ) {
                                    pk
                                    stripeCustomerId
                                    stripeConnectAccountId
                                }
                            }
                        }
                    `),
                    variables: {
                        user: UserPK.stringify(testMainUser),
                        [field]: "new value",
                    },
                });
                await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
                    {
                        code: "PERMISSION_DENIED",
                        path: `getUser.updateUser`,
                        message: "You do not have permission to perform this action.",
                    },
                ]);
            });
        }
    });
});
