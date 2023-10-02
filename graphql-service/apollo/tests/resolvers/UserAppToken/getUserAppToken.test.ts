import { RequestContext, createDefaultContextBatched } from "@/RequestContext";
import { PricingAvailability } from "@/__generated__/gql/graphql";
import { App } from "@/database/models/App";
import { Pricing } from "@/database/models/Pricing";
import { User } from "@/database/models/User";
import { UserAppToken } from "@/database/models/UserAppToken";
import { createUserAppToken } from "@/functions/token";
import { AppPK } from "@/pks/AppPK";
import { PricingPK } from "@/pks/PricingPK";
import { UserAppTokenPK } from "@/pks/UserAppToken";
import { UserPK } from "@/pks/UserPK";
import { getOrCreateTestUser, simplifyGraphQLPromiseRejection } from "@/tests/test-utils";
import { testGQLClient } from "@/tests/testGQLClient";
import { graphql, untypedGraphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

const getUserAppTokenQuery = graphql(`
    query Test_GetUserAppToken($pk: ID, $app: ID, $subscriber: ID) {
        getUserAppToken(pk: $pk, app: $app, subscriber: $subscriber) {
            pk
            createdAt
            updatedAt
            signature
            app {
                pk
            }
            subscriber {
                pk
            }
            token
        }
    }
`);

describe("getUserAppToken", () => {
    let testAppOwner: User;
    let testSubscriber: User;
    let testApp: App;
    let testPricing: Pricing;
    let testUserAppToken: UserAppToken;

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context, { email: `testuser_${uuid.v4()}@gmail_mock.com` });
        testSubscriber = await getOrCreateTestUser(context, { email: `testuser_${uuid.v4()}@gmail_mock.com` });
        testApp = await context.batched.App.create({
            name: `test-${uuid.v4()}`,
            owner: UserPK.stringify(testAppOwner),
        });
        testPricing = await context.batched.Pricing.create({
            app: AppPK.stringify(testApp),
            name: "test-pricing",
            availability: PricingAvailability.Public,
        });
        await context.batched.Subscription.create({
            app: AppPK.stringify(testApp),
            subscriber: UserPK.stringify(testSubscriber),
            pricing: PricingPK.stringify(testPricing),
        });
        testUserAppToken = (
            await createUserAppToken(context, {
                user: UserPK.stringify(testSubscriber),
                app: AppPK.stringify(testApp),
            })
        ).userAppToken;
    });

    test("Subscriber can query their own token.", async () => {
        const result = await testGQLClient({
            user: testSubscriber,
        }).query({
            query: getUserAppTokenQuery,
            variables: {
                pk: UserAppTokenPK.stringify(testUserAppToken),
            },
        });
        expect(result.errors).toBeUndefined();
        expect(result.data).toMatchObject({
            getUserAppToken: {
                __typename: "UserAppToken",
                pk: UserAppTokenPK.stringify(testUserAppToken),
                signature: testUserAppToken.signature,
                createdAt: testUserAppToken.createdAt,
                updatedAt: testUserAppToken.updatedAt,
                subscriber: {
                    __typename: "User",
                    pk: UserPK.stringify(testSubscriber),
                },
                app: {
                    __typename: "App",
                    pk: AppPK.stringify(testApp),
                },
            },
        });
    });

    for (const subquery of ["pk", "createdAt", "updatedAt", "signature", "app {pk}", "subscriber {pk}", "token"]) {
        test(`Subscriber cannot query another user's token with subquery ${subquery}.`, async () => {
            const result = testGQLClient({
                user: testAppOwner,
            }).query({
                query: untypedGraphql(`
                    query GetUserAppToken($pk: ID) {
                        getUserAppToken(pk: $pk) {
                            ${subquery}
                        }
                    }
                `),
                variables: {
                    pk: UserAppTokenPK.stringify(testUserAppToken),
                },
            });
            await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
                {
                    code: "PERMISSION_DENIED",
                    message: "You do not have permission to perform this action.",
                    path: `getUserAppToken.${subquery.split(" ")[0]}`,
                },
            ]);
        });
    }

    test("token must be null becuase it can only be viewed once when created.", async () => {
        const result = await testGQLClient({
            user: testSubscriber,
        }).query({
            query: getUserAppTokenQuery,
            variables: {
                pk: UserAppTokenPK.stringify(testUserAppToken),
            },
        });
        expect(result.errors).toBeUndefined();
        expect(result.data).toMatchObject({
            getUserAppToken: {
                __typename: "UserAppToken",
                token: null,
            },
        });
    });

    test("Query with empty args should throw not found", async () => {
        const result = testGQLClient({
            user: testSubscriber,
        }).query({
            query: getUserAppTokenQuery,
            variables: {},
        });
        await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
            {
                code: "NOT_FOUND",
                path: "getUserAppToken",
            },
        ]);
    });

    test("Can query with app and user IDs", async () => {
        const result = await testGQLClient({
            user: testSubscriber,
        }).query({
            query: getUserAppTokenQuery,
            variables: {
                app: AppPK.stringify(testApp),
                subscriber: UserPK.stringify(testSubscriber),
            },
        });
        expect(result.errors).toBeUndefined();
        expect(result.data).toMatchObject({
            getUserAppToken: {
                __typename: "UserAppToken",
                pk: UserAppTokenPK.stringify(testUserAppToken),
                signature: testUserAppToken.signature,
                createdAt: testUserAppToken.createdAt,
                updatedAt: testUserAppToken.updatedAt,
                subscriber: {
                    __typename: "User",
                    pk: UserPK.stringify(testSubscriber),
                },
                app: {
                    __typename: "App",
                    pk: AppPK.stringify(testApp),
                },
            },
        });
    });
});
