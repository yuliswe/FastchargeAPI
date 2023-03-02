import { App, Endpoint, Pricing, Subscription, User } from "./dynamoose/models";
import { Denied } from "./errors";
import { RequestContext } from "./RequestContext";
import {
    GQLEndpointUpdateEndpointArgs,
    GQLMutationCreateAppArgs,
    GQLMutationCreateEndpointArgs,
    GQLMutationCreateSubscriptionArgs,
    GQLMutationCreateUsageLogArgs,
    GQLQueryEndpointArgs,
    GQLQueryStripePaymentAcceptArgs,
    GQLQuerySubscriptionArgs,
} from "./__generated__/resolvers-types";

export const Can = {
    async viewUser(
        { email }: { email: string },
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async listUsers(context: RequestContext): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewApp(
        { owner }: { owner: string },
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createUser({ email }: { email: string }, context: RequestContext) {
        return await Promise.resolve(true);
        // return userEmail === "ylilarry@gmail.com"
    },
    async updateUser({ email }: { email: string }, context: RequestContext) {
        return await Promise.resolve(true);
    },
    async createApp(
        args: GQLMutationCreateAppArgs,
        context: RequestContext
    ): Promise<boolean> {
        // Is the current user the claimed owner of the app?
        // return await Promise.resolve(args.owner === context.currentUser)
        return await Promise.resolve(true);
    },
    async updateApp(
        { owner }: { owner: string },
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async deleteApp(
        { name }: { name: string },
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createAppUserToken(
        parent: App,
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async revokeAppUserToken(
        parent: App,
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createEndpoint(
        { app }: GQLMutationCreateEndpointArgs,
        context: RequestContext
    ): Promise<boolean> {
        let appObj = await context.batched.App.get(app);
        return await Promise.resolve(true);
    },
    async createPricing(
        { app }: { app: string },
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async deletePricing(
        parent: Pricing,
        args: never,
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createSubscribe(
        args: GQLMutationCreateSubscriptionArgs,
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async deleteSubscribe(
        parent: Subscription,
        args: {},
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewSubscribe(
        parent: {},
        args: GQLQuerySubscriptionArgs,
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async updateEndpoint(
        args: GQLEndpointUpdateEndpointArgs,
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async viewEndpoint(
        args: GQLQueryEndpointArgs,
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async deleteEndpoint(
        parent: Endpoint,
        args: never,
        context: RequestContext
    ): Promise<boolean> {
        return await Promise.resolve(true);
    },
    async createUsageLog(
        args: GQLMutationCreateUsageLogArgs,
        context: RequestContext
    ) {
        return await Promise.resolve(true);
    },
    async readStripePaymentAccepts(
        parent: User,
        args: GQLQueryStripePaymentAcceptArgs,
        context: RequestContext
    ) {
        return await Promise.resolve(true);
    },
    async *viewAppIter<App extends { owner: string }>(
        arr: App[],
        context: RequestContext
    ): AsyncIterable<[boolean, App]> {
        let results = await Promise.allSettled(
            arr.map((item) => Can.viewApp(item, context))
        );
        for (let [index, result] of results.entries()) {
            if (result.status === "fulfilled") {
                yield [true, arr[index]];
            } else {
                yield [false, arr[index]];
            }
        }
    },
    async viewAppFilter<App extends { owner: string }>(
        arr: App[],
        context: RequestContext
    ): Promise<App[]> {
        let results: any[] = [];
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
