import { RequestContext } from "./RequestContext";
import {
    GQLAppTagUpdateAppTagArgs,
    GQLAppUpdateAppArgs,
    GQLEndpointUpdateEndpointArgs,
    GQLMutationCreateEndpointArgs,
    GQLMutationCreateSubscriptionArgs,
    GQLPricingAvailability,
    GQLPricingUpdatePricingArgs,
    GQLQuerySubscriptionArgs,
    GQLSiteMetaDataKey,
    GQLSubscribeUpdateSubscriptionArgs,
    GQLUserUpdateUserArgs,
} from "./__generated__/resolvers-types";
import {
    AccountActivity,
    AccountHistory,
    App,
    AppTag,
    Endpoint,
    Pricing,
    StripePaymentAccept,
    StripeTransfer,
    Subscription,
    UsageLog,
    UsageSummary,
    User,
    UserAppToken,
} from "./dynamoose/models";
import { AppPK } from "./pks/AppPK";
import { PricingPK } from "./pks/PricingPK";
import { UserPK } from "./pks/UserPK";

export const Can = {
    async viewUserPrivateAttributes(user: User, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(user.uid === context.currentUser.uid);
    },
    async createUserPrivateResources(user: User, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(user.uid === context.currentUser.uid);
    },
    async updateUser(
        user: User,
        { author, stripeCustomerId, stripeConnectAccountId }: GQLUserUpdateUserArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (stripeCustomerId || stripeConnectAccountId) {
            return context.isServiceRequest;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(user.uid === context.currentUser.uid);
    },
    // async listUsers(context: RequestContext): Promise<boolean> {
    //     if (context.isServiceRequest) {
    //         return Promise.resolve(true);
    //     }
    //     return Promise.resolve(false);
    // },
    async settleUserAccountActivities(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isSQSMessage && context.isServiceRequest);
    },
    // async viewApp({ owner }: { owner: string }, context: RequestContext): Promise<boolean> {
    //     return await Promise.resolve(true);
    // },
    async createUser(context: RequestContext): Promise<boolean> {
        return await Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
    },
    async createApp({ owner }: { owner: string }, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewAppHiddenPricingPlans(parent: App, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.owner === UserPK.stringify(context.currentUser));
    },
    async updateApp(
        parent: App,
        { title, description, homepage, repository }: GQLAppUpdateAppArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.owner === UserPK.stringify(context.currentUser));
    },
    async deleteApp(parent: App, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.owner === UserPK.stringify(context.currentUser));
    },
    async createAppUserToken(parent: App, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async revokeAppUserToken(parent: App, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewPricingInvisiableAttributes(pricing: Pricing, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(pricing.app));
        const isOwner = await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
        if (isOwner) {
            return true;
        }
        if (pricing.availability === GQLPricingAvailability.Public) {
            return true;
        }
        if (pricing.availability === GQLPricingAvailability.ExistingSubscribers) {
            return await context.batched.Subscription.exists({
                app: pricing.app,
                subscriber: UserPK.stringify(context.currentUser),
                pricing: PricingPK.stringify(pricing),
            });
        }
        return false;
    },
    async createPricing({ app: appPK }: { app: string }, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(appPK));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async deletePricing(parent: Pricing, args: never, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async updatePricing(
        parent: Pricing,
        context: RequestContext,
        { minMonthlyCharge, chargePerRequest, freeQuota }: GQLPricingUpdatePricingArgs
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        // These properties are not allowed to be updated unless by admin
        if (minMonthlyCharge != null || chargePerRequest != null || freeQuota != null) {
            return context.isAdminUser ?? false;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async viewSubscriptionPrivateAttributes(parent: Subscription, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (parent.subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        if (app.owner === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return false;
    },
    async createSubscription(
        { pricing, subscriber }: GQLMutationCreateSubscriptionArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return Promise.resolve(false);
    },
    async updateSubscription(
        parent: Subscription,
        { pricing }: GQLSubscribeUpdateSubscriptionArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (parent.subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return Promise.resolve(false);
    },
    async deleteSubscription(parent: Subscription, args: {}, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (parent.subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return Promise.resolve(false);
    },
    async viewSubscription(
        subscription: Subscription,
        args: GQLQuerySubscriptionArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (subscription.subscriber === UserPK.stringify(context.currentUser)) {
            return true;
        }
        const app = await context.batched.App.get(AppPK.parse(subscription.app));
        if (app.owner === UserPK.stringify(context.currentUser)) {
            return true;
        }
        return false;
    },
    async createEndpoint(
        { app: appPK, method, path, description, destination }: GQLMutationCreateEndpointArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(appPK));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async updateEndpoint(
        parent: Endpoint,
        { method, path, description, destination }: GQLEndpointUpdateEndpointArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async viewPrivateEndpointArributes(parent: Endpoint, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async deleteEndpoint(parent: Endpoint, args: never, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async createUsageLog(context: RequestContext) {
        return await Promise.resolve(context.isServiceRequest);
    },
    async viewUsageLogPrivateAttributes(parent: UsageLog, context: RequestContext) {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.subscriber === UserPK.stringify(context.currentUser));
    },
    async viewStripePaymentAcceptPrivateAttributes(parent: StripePaymentAccept, context: RequestContext) {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.user === UserPK.stringify(context.currentUser));
    },
    async viewStripePaymentAccept(item: StripePaymentAccept, context: RequestContext) {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(item.user === UserPK.stringify(context.currentUser));
    },
    async createStripePaymentAccept(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isSQSMessage && context.isServiceRequest);
    },
    async viewAccountActivityPrivateAttributes(parent: AccountActivity, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.user === UserPK.stringify(context.currentUser));
    },
    async viewAccountHistoryPrivateAttributes(parent: AccountHistory, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.user === UserPK.stringify(context.currentUser));
    },
    async viewUserAppTokenPrivateAttributes(parent: UserAppToken, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.subscriber === UserPK.stringify(context.currentUser));
    },
    async deleteUserAppToken(parent: UserAppToken, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.subscriber === UserPK.stringify(context.currentUser));
    },
    async viewStripeTransferPrivateAttributes(parent: StripeTransfer, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.receiver === UserPK.stringify(context.currentUser));
    },
    async viewStripeTransfer(parent: StripeTransfer, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.receiver === UserPK.stringify(context.currentUser));
    },
    async createStripeTransfer(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isSQSMessage && context.isServiceRequest);
    },
    async viewUsageSummaryPrivateAttributes(
        parent: UsageSummary,
        context: RequestContext,
        { allowAppOwner = false }: { allowAppOwner?: boolean } = {}
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (allowAppOwner) {
            const app = await context.batched.App.get(AppPK.parse(parent.app));
            if (app.owner === UserPK.stringify(context.currentUser)) {
                return true;
            }
        }
        return await Promise.resolve(parent.subscriber === UserPK.stringify(context.currentUser));
    },
    async createAccountActivity(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
    },
    async flushAppSearchIndex(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
    },
    async createAppTag(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
    },
    async updateAppTag(parent: AppTag, { tag }: GQLAppTagUpdateAppTagArgs, context: RequestContext): Promise<boolean> {
        if (tag === "Featured" || tag === "Latest") {
            return Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
        }
        if (!context.currentUser) {
            return false;
        }
        const app = await context.batched.App.get(AppPK.parse(parent.app));
        return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
    },
    async viewSiteMetaData(context: RequestContext, key: GQLSiteMetaDataKey): Promise<boolean> {
        return Promise.resolve(true);
    },
    async updateSiteMetaData(context: RequestContext, key: GQLSiteMetaDataKey): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },
    async deleteSiteMetaData(context: RequestContext, key: GQLSiteMetaDataKey): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },
    async createSiteMetaData(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },

    // async *viewAppIter<App extends { owner: string }>(
    //     arr: App[],
    //     context: RequestContext
    // ): AsyncIterable<[boolean, App]> {
    //     let results = await Promise.allSettled(arr.map((item) => Can.viewApp(item, context)));
    //     for (let [index, result] of results.entries()) {
    //         if (result.status === "fulfilled") {
    //             yield [true, arr[index]];
    //         } else {
    //             yield [false, arr[index]];
    //         }
    //     }
    // },
    // async viewAppFilter<App extends { owner: string }>(arr: App[], context: RequestContext): Promise<App[]> {
    //     let results: App[] = [];
    //     for await (let [canView, item] of Can.viewAppIter(arr, context)) {
    //         if (canView) {
    //             results.push(item);
    //         }
    //     }
    //     return results;
    // },
};

// export const Cannot = {
//     async * viewApp(arr: Iterable<{ email: string }>, context: RequestContext) {
//         for await (let item of arr) {
//             if (!(await Can.viewApp(item, context))) {
//                 yield item
//             }
//         }
//     }
// }
