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
import {
    baseRequestContext as context,
    getOrCreateTestUser,
    simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils";
import { testGQLClient } from "@/tests/testGQLClient";
import { graphql } from "@/typed-graphql";
import { beforeEach, describe, expect, test } from "@jest/globals";
import * as uuid from "uuid";

describe("getUserAppTokenBySubscriber", () => {
    let testAppOwner: User;
    let testSubscriber: User;
    let testApp: App;
    let testPricing: Pricing;
    let testUserAppToken: UserAppToken;

    beforeEach(async () => {
        testAppOwner = await getOrCreateTestUser(context);
        testSubscriber = await getOrCreateTestUser(context);
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

    const getUserAppTokenBySubscriberQuery = graphql(`
        query Test_getUserAppTokenBySubscriber($subscriber: ID!, $app: ID) {
            getUserAppTokenBySubscriber(subscriber: $subscriber, app: $app) {
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

    function getVariables() {
        return {
            subscriber: UserPK.stringify(testSubscriber),
            app: AppPK.stringify(testApp),
        };
    }

    function getExpected() {
        return {
            data: {
                getUserAppTokenBySubscriber: {
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
            },
        };
    }

    test("Subscriber can get their own token.", async () => {
        const promise = testGQLClient({
            user: testSubscriber,
        }).query({
            query: getUserAppTokenBySubscriberQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject(getExpected());
    });

    test("Subscriber cannot query another user's token.", async () => {
        const result = testGQLClient({
            user: testAppOwner,
        }).query({
            query: getUserAppTokenBySubscriberQuery,
            variables: getVariables(),
        });
        await expect(simplifyGraphQLPromiseRejection(result)).rejects.toMatchObject([
            {
                code: "PERMISSION_DENIED",
                message: "You do not have permission to perform this action.",
                path: "getUserAppTokenBySubscriber",
            },
        ]);
    });

    test("token must be null becuase it can only be viewed once when created.", async () => {
        const promise = testGQLClient({
            user: testSubscriber,
        }).query({
            query: getUserAppTokenBySubscriberQuery,
            variables: getVariables(),
        });
        await expect(promise).resolves.toMatchObject({
            data: {
                getUserAppTokenBySubscriber: {
                    __typename: "UserAppToken",
                    token: null,
                },
            },
        });
    });
});
