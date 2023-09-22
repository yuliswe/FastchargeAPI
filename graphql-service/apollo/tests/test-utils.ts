import { mockSQS } from "@/MockSQS";
import { createDefaultContextBatched } from "@/RequestContext";
import { SQSQueueUrl, sqsGQLClient } from "@/sqsClient";
import { graphql } from "@/typed-graphql";
import { ApolloError } from "@apollo/client";
import { v4 as uuid4 } from "uuid";
import { RequestContext } from "../RequestContext";
import { App, FreeQuotaUsage, GQLPartial, Pricing, User, UserIndex } from "../database/models";
import { createUserWithEmail } from "../functions/user";
import { AppPK } from "../pks/AppPK";

export const baseRequestContext: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

export async function addMoneyForUser(
    context: RequestContext,
    { user, amount }: { user: string; amount: string }
): Promise<void> {
    const stripeSessionId = uuid4();
    await context.batched.StripePaymentAccept.create({
        user: user,
        amount: amount,
        currency: "usd",
        stripePaymentStatus: "paid",
        stripeSessionId,
        stripePaymentIntent: "test",
        stripeSessionObject: {},
    });

    await sqsGQLClient({
        queueUrl: SQSQueueUrl.BillingQueue,
        dedupId: `addMoneyForUser-${user}-${amount}-${uuid4()}`,
        groupId: user,
    }).query({
        query: graphql(`
            query GetAndSettleStripePaymentAccept($user: ID!, $stripeSessionId: String!) {
                getStripePaymentAccept(user: $user, stripeSessionId: $stripeSessionId) {
                    settlePayment {
                        status
                    }
                }
            }
        `),
        variables: {
            stripeSessionId,
            user: user,
        },
    });

    if (process.env.LOCAL_SQS === "1") {
        await mockSQS.waitForQueuesToEmpty();
    }
}

/**
 * Create a user with the given email for testing purposes.
 * @returns Created user object.
 */
export async function getOrCreateTestUser(
    context: RequestContext,
    { email, ...additionalProps }: { email: string } & GQLPartial<User>
) {
    if (!email) {
        email = `testuser_${uuid4()}@gmail_mock.com`;
    }
    let user = await context.batched.User.getOrNull({ email }, { using: UserIndex.IndexByEmailOnlyPk });
    if (user === null) {
        user = await createUserWithEmail(context.batched, email, additionalProps);
    }
    return user;
}

export async function getAdminUser(context: RequestContext): Promise<User> {
    return await context.batched.User.get(
        { email: "fastchargeapi@gmail.com" },
        { using: UserIndex.IndexByEmailOnlyPk }
    );
}

export async function createOrUpdatePricing(
    context: RequestContext,
    { name, app }: { name: string; app: App },
    props: Partial<Pricing>
): Promise<Pricing> {
    let pricing = await context.batched.Pricing.getOrNull({ name, app: AppPK.stringify(app) });
    if (pricing === null) {
        pricing = await context.batched.Pricing.create({
            name,
            app: AppPK.stringify(app),
            ...props,
        });
    } else {
        pricing = await context.batched.Pricing.update(pricing, props);
    }
    return pricing;
}

export async function getOrCreateFreeQuotaUsage(
    context: RequestContext,
    {
        subscriber,
        app,
    }: {
        subscriber: string;
        app: string;
    }
): Promise<FreeQuotaUsage> {
    let freeQuotaUsage = await context.batched.FreeQuotaUsage.getOrNull({ subscriber, app });
    if (freeQuotaUsage === null) {
        freeQuotaUsage = await context.batched.FreeQuotaUsage.create({
            subscriber,
            app,
            usage: 0,
        });
    }
    return freeQuotaUsage;
}

type SimplifiedGraphQLError = { message: string; code: string; path: string };

export function sortGraphQLErrors<T extends Partial<SimplifiedGraphQLError>>(errors: T[]): T[] {
    const sortedErrors = errors;
    sortedErrors.sort((a, b) => {
        const diffByPath = (a.path || "").localeCompare(b.path || "");
        if (diffByPath !== 0) {
            return diffByPath;
        }
        const diffByCode = (a.code || "").localeCompare(b.code || "");
        if (diffByCode !== 0) {
            return diffByCode;
        }
        return (a.message || "").localeCompare(b.message || "");
    });
    return sortedErrors;
}

export function simplifyGraphQLError(error: unknown) {
    if (!(error instanceof ApolloError)) {
        return error;
    }
    const simpleErrors: SimplifiedGraphQLError[] = [];
    for (const e of error.graphQLErrors) {
        simpleErrors.push({
            message: e.message,
            code: e.extensions.code as string,
            path: e.path?.map((x) => x.toString()).join(".") ?? "",
        });
    }
    return sortGraphQLErrors(simpleErrors);
}

export async function simplifyGraphQLPromiseRejection(errorPromise: Promise<unknown>): Promise<unknown> {
    try {
        return await errorPromise;
    } catch (error) {
        throw simplifyGraphQLError(error);
    }
}
