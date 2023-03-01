import { GraphQLResolveInfo } from "graphql";
import type { UsageLog } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateUsageLogArgs,
    GQLResolvers,
    GQLUsageLogResolvers,
} from "../__generated__/resolvers-types";

/**
 * Remember to add your resolver to the resolvers object in server.ts.
 *
 * Note that to make the typing work, you must also add your Models to the
 * codegen.yml file, under the mappers section.
 */
export const usageLogResolvers: GQLResolvers & {
    UsageLog: Required<GQLUsageLogResolvers>;
} = {
    UsageLog: {
        async app(parent: UsageLog, args, context, info) {
            let app = await context.batched.App.get(parent.app);
            return app;
        },
        async subscriber(parent: UsageLog, args, context, info) {
            let subscriber = await context.batched.User.get(parent.subscriber);
            return subscriber;
        },
        async endpoint(parent: UsageLog, args, context, info) {
            let endpoint = await context.batched.Endpoint.get({
                app: parent.app,
                path: parent.path,
            });
            return endpoint;
        },
        status: (parent: UsageLog) => parent.status,
        collectedAt: (parent: UsageLog) => parent.collectedAt,
        volume: (parent: UsageLog) => parent.volume,
        createdAt: (parent: UsageLog) => parent.createdAt,
        __isTypeOf: (parent: UsageLog, context) =>
            parent instanceof context.batched.UsageLog.model,
    },
    Query: {},
    Mutation: {
        async createUsageLog(
            parent: {},
            args: GQLMutationCreateUsageLogArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            let { app, path, subscriber, volume } = args;
            if (!(await Can.createUsageLog(args, context))) {
                throw new Denied();
            }
            await context.batched.App.assertExists(app);
            const log = await context.batched.UsageLog.create({
                app,
                path,
                subscriber,
                volume,
            });
            return log;
        },
    },
};
