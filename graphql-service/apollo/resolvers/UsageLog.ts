import type { UsageLog } from "@/database/models/UsageLog";
import { AppPK } from "@/pks/AppPK";
import { EndpointPK } from "@/pks/EndpointPK";
import { PricingPK } from "@/pks/PricingPK";
import { RequestContext } from "../RequestContext";
import { GQLMutationCreateUsageLogArgs, GQLResolvers, GQLUsageLogResolvers } from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { UsageLogPK } from "../pks/UsageLogPK";
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

export const UsageLogResolvers: GQLResolvers & {
  UsageLog: Required<GQLUsageLogResolvers>;
} = {
  UsageLog: {
    __isTypeOf: (parent, context) => parent instanceof context.batched.UsageLog.model,
    pk: makePrivate((parent) => UsageLogPK.stringify(parent)),
    status: makePrivate((parent) => parent.status),
    collectedAt: makePrivate((parent) => parent.collectedAt),
    volume: makePrivate((parent) => parent.volume),
    createdAt: makePrivate((parent) => parent.createdAt),
    app: makePrivate((parent, _, context) => context.batched.App.get(AppPK.parse(parent.app))),
    subscriber: makePrivate((parent, _, context) => context.batched.User.get(UserPK.parse(parent.subscriber))),
    endpoint: makePrivate((parent, _, context) => context.batched.Endpoint.get(EndpointPK.parse(parent.subscriber))),
    pricing: makePrivate((parent, _, context) => context.batched.Pricing.get(PricingPK.parse(parent.pricing))),
    path: makePrivate((parent) => parent.path),
  },
  Query: {
    async listUsageLogsBySubscriber(parent, { subscriber, app, path, limit, dateRange }, context): Promise<UsageLog[]> {
      if (!(await Can.listUsageLogsByAppSubscriber({ subscriber }, context))) {
        throw new Denied();
      }
      return await context.batched.UsageLog.many(
        {
          subscriber: UserPK.guard(subscriber),
          path: path ?? undefined,
          app: app ? AppPK.guard(app) : undefined,
          createdAt: dateRange
            ? {
                le: dateRange.end ?? undefined,
                ge: dateRange.start ?? undefined,
              }
            : undefined,
        },
        {
          limit: Math.min(limit || 1000, 1000),
        }
      );
    },
  },
  Mutation: {
    async createUsageLog(
      parent: {},
      { app, path, subscriber, volume, pricing }: GQLMutationCreateUsageLogArgs,
      context: RequestContext
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
