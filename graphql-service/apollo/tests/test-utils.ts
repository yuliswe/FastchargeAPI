import { createDefaultContextBatched } from "@/RequestContext";
import { Currency } from "@/__generated__/resolvers-types";
import { App } from "@/database/models/App";
import { FreeQuotaUsage } from "@/database/models/FreeQuotaUsage";
import { Pricing } from "@/database/models/Pricing";
import { User, UserTableIndex } from "@/database/models/User";
import { GQLPartial } from "@/database/utils";
import { getUserBalance } from "@/functions/account";
import { getDedupIdForSettleStripePaymentAcceptSQS } from "@/functions/payment";
import { StripePaymentAcceptPK } from "@/pks/StripePaymentAccept";
import { UserPK } from "@/pks/UserPK";
import { SQSQueueName } from "@/sqsClient";
import { graphql } from "@/typed-graphql";
import { ApolloError } from "@apollo/client";
import { v4 as uuid4 } from "uuid";
import { RequestContext } from "../RequestContext";
import { createUserWithEmail } from "../functions/user";
import { AppPK } from "../pks/AppPK";
import { testGQLClientForSQS } from "./testGQLClient";

export const baseRequestContext: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};

export async function addMoneyForUser({
    user,
    amount,
    context,
}: {
    user: string;
    amount: string;
    context: RequestContext;
}): Promise<void> {
    const stripeSessionId = uuid4();
    const stripePaymentAccept = await context.batched.StripePaymentAccept.create({
        user: user,
        amount: amount,
        currency: Currency.Usd,
        stripePaymentStatus: "paid",
        stripeSessionId,
        stripePaymentIntent: "test",
        stripeSessionObject: {},
    });

    await testGQLClientForSQS({
        queueName: SQSQueueName.BillingQueue,
        dedupId: getDedupIdForSettleStripePaymentAcceptSQS(stripePaymentAccept),
        groupId: user,
    }).mutate({
        mutation: graphql(`
            mutation GetAndSettleStripePaymentAccept($pk: ID!) {
                getStripePaymentAccept(pk: $pk) {
                    _settleStripePaymentAcceptFromSQS {
                        status
                    }
                }
            }
        `),
        variables: {
            pk: StripePaymentAcceptPK.stringify(stripePaymentAccept),
        },
    });
}

/**
 * Create a user with the given email for testing purposes.
 * @returns Created user object.
 */
export async function getOrCreateTestUser(
    context: RequestContext,
    { email, ...additionalProps }: { email?: string } & GQLPartial<User> = {}
) {
    if (!email) {
        email = `testuser_${uuid4()}@gmail_mock.com`;
    }
    let user = await context.batched.User.getOrNull({ email }, { using: UserTableIndex.IndexByEmailOnlyPk });
    if (user === null) {
        user = await createUserWithEmail(context.batched, email, additionalProps);
    }
    return user;
}

export async function getAdminUser(context: RequestContext): Promise<User> {
    return await context.batched.User.get(
        { email: "fastchargeapi@gmail.com" },
        { using: UserTableIndex.IndexByEmailOnlyPk }
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

export async function getUserBalanceNoCache(context: RequestContext, user: User): Promise<string> {
    context.batched.AccountHistory.clearCache();
    return getUserBalance(context, UserPK.stringify(user));
}
