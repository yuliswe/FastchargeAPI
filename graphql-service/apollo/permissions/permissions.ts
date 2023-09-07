import { RequestContext } from "../RequestContext";

import { Endpoint } from "../database/models";
import { AppPK } from "../pks/AppPK";
import { UserPK } from "../pks/UserPK";

export const OtherPermissions = {
    // async listUsers(context: RequestContext): Promise<boolean> {
    //     if (context.isServiceRequest) {
    //         return Promise.resolve(true);
    //     }
    //     return Promise.resolve(false);
    // },
    async settleUserAccountActivities(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isSQSMessage && context.isServiceRequest);
    },
    async triggerBilling(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isServiceRequest);
    },
    // async viewApp({ owner }: { owner: string }, context: RequestContext): Promise<boolean> {
    //     return await Promise.resolve(true);
    // },
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
    async flushAppSearchIndex(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isServiceRequest || context.isAdminUser || false);
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
