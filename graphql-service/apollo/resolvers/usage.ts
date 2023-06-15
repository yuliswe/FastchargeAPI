import { GraphQLResolveInfo } from "graphql";
import type { UsageLog } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import { GQLMutationCreateUsageLogArgs, GQLResolvers, GQLUsageLogResolvers } from "../__generated__/resolvers-types";
import { AppPK } from "../pks/AppPK";
import { UserPK } from "../pks/UserPK";

/**
 * Make is so that only the owner can read the private attributes.
 */
function makePrivate<T>(
    getter: (parent: UsageLog, args: {}, context: RequestContext) => T
): (parent: UsageLog, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: UsageLog, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewUsageLogPrivateAttributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const usageLogResolvers: GQLResolvers & {
    UsageLog: Required<GQLUsageLogResolvers>;
} = {
    UsageLog: {
        __isTypeOf: (parent: UsageLog, context) => parent instanceof context.batched.UsageLog.model,
        status: makePrivate((parent: UsageLog) => parent.status),
        collectedAt: makePrivate((parent: UsageLog) => parent.collectedAt),
        volume: makePrivate((parent: UsageLog) => parent.volume),
        createdAt: makePrivate((parent: UsageLog) => parent.createdAt),

        async app(parent: UsageLog, args, context, info) {
            if (!(await Can.viewUsageLogPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            const app = await context.batched.App.get(AppPK.parse(parent.app));
            return app;
        },
        async subscriber(parent: UsageLog, args, context, info) {
            if (!(await Can.viewUsageLogPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            const subscriber = await context.batched.User.get(UserPK.parse(parent.subscriber));
            return subscriber;
        },
        async endpoint(parent: UsageLog, args, context, info) {
            if (!(await Can.viewUsageLogPrivateAttributes(parent, context))) {
                throw new Denied();
            }
            const endpoint = await context.batched.Endpoint.get({
                app: parent.app,
                path: parent.path,
            });
            return endpoint;
        },
    },
    Query: {},
    Mutation: {
        async createUsageLog(
            parent: {},
            { app, path, subscriber, volume, pricing }: GQLMutationCreateUsageLogArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            if (!(await Can.createUsageLog(context))) {
                throw new Denied();
            }
            await context.batched.App.assertExists(AppPK.parse(app));
            return await context.batched.UsageLog.create({
                app,
                path,
                subscriber,
                volume,
                pricing,
            });
        },
    },
};
