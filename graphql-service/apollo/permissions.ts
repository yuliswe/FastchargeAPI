import { App, Endpoint, Pricing, Subscription, User } from "./dynamoose/models";
import { RequestContext } from "./RequestContext";
import {
    GQLAppUpdateAppArgs,
    GQLMutationCreateEndpointArgs,
    GQLMutationCreateSubscriptionArgs,
    GQLMutationCreateUsageLogArgs,
    GQLQueryEndpointArgs,
    GQLQueryStripePaymentAcceptArgs,
    GQLQuerySubscriptionArgs,
    GQLUserUpdateUserArgs,
} from "./__generated__/resolvers-types";
import { AppPK } from "./pks/AppPK";

export const Can = {
    async viewUserPrivateInfo(user: User, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(user.uid === context.currentUser.uid);
    },
    async createUserPrivateResources(user: User, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest) {
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
        if (context.isServiceRequest) {
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
    async listUsers(context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest) {
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    },
    async settleUserAccountActivities(context: RequestContext): Promise<boolean> {
        if (context.isSQSMessage && context.isServiceRequest) {
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    },

    async viewApp({ owner }: { owner: string }, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createUser({ email }: { email: string }, context: RequestContext) {
        return await Promise.resolve(context.isServiceRequest);
        // return userEmail === "ylilarry@gmail.com"
    },
    async createApp({ owner }: { owner: string }, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async updateApp(
        parent: App,
        { title, description, homepage, repository }: GQLAppUpdateAppArgs,
        context: RequestContext
    ): Promise<boolean> {
        if (context.isServiceRequest) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.owner === context.currentUser.uid);
    },
    async deleteApp(parent: App, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        return await Promise.resolve(parent.owner === context.currentUser.uid);
    },
    async createAppUserToken(parent: App, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async revokeAppUserToken(parent: App, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createEndpoint({ app }: GQLMutationCreateEndpointArgs, context: RequestContext): Promise<boolean> {
        let appObj = await context.batched.App.get(AppPK.parse(app));
        return await Promise.resolve(true);
    },
    async createPricing({ app }: { app: string }, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async deletePricing(parent: Pricing, args: never, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createSubscribe(args: GQLMutationCreateSubscriptionArgs, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async deleteSubscribe(parent: Subscription, args: {}, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewSubscribe(parent: {}, args: GQLQuerySubscriptionArgs, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async updateEndpoint(parent: Endpoint, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewEndpoint(args: GQLQueryEndpointArgs, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async deleteEndpoint(parent: Endpoint, args: never, context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createUsageLog(args: GQLMutationCreateUsageLogArgs, context: RequestContext) {
        return await Promise.resolve(true);
    },
    async readStripePaymentAccepts(parent: User, args: GQLQueryStripePaymentAcceptArgs, context: RequestContext) {
        return await Promise.resolve(true);
    },
    async *viewAppIter<App extends { owner: string }>(
        arr: App[],
        context: RequestContext
    ): AsyncIterable<[boolean, App]> {
        let results = await Promise.allSettled(arr.map((item) => Can.viewApp(item, context)));
        for (let [index, result] of results.entries()) {
            if (result.status === "fulfilled") {
                yield [true, arr[index]];
            } else {
                yield [false, arr[index]];
            }
        }
    },
    async viewAppFilter<App extends { owner: string }>(arr: App[], context: RequestContext): Promise<App[]> {
        let results: App[] = [];
        for await (let [canView, item] of Can.viewAppIter(arr, context)) {
            if (canView) {
                results.push(item);
            }
        }
        return results;
    },
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
