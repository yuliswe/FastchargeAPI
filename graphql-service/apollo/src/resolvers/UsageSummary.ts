import { RequestContext } from "@/src/RequestContext";
import {
  GQLMutationTriggerBillingArgs,
  GQLQueryListUsageSummariesByAppSubscriberArgs,
  GQLResolvers,
  GQLUsageSummaryResolvers,
} from "@/src/__generated__/resolvers-types";
import { UsageSummary, UsageSummaryModel } from "@/src/database/models/UsageSummary";
import { Denied } from "@/src/errors";
import { enforceCalledFromSQS } from "@/src/functions/aws";
import { sqsTriggerBilling } from "@/src/functions/billing";
import { Can } from "@/src/permissions";
import { AccountActivityPK } from "@/src/pks/AccountActivityPK";
import { AppPK } from "@/src/pks/AppPK";
import { UsageSummaryPK } from "@/src/pks/UsageSummaryPK";
import { UserPK } from "@/src/pks/UserPK";
import { SQSQueueName, getSQSClient } from "@/src/sqsClient";
import { graphql } from "@/src/typed-graphql";

/**
 * Make is so that only the owner can read the private attributes.
 */
function makePrivate<T>(
  { allowAppOwner = false }: { allowAppOwner?: boolean } = {},
  getter: (parent: UsageSummary) => T
): (parent: UsageSummary, args: {}, context: RequestContext) => Promise<T> {
  return async (parent: UsageSummary, args: {}, context: RequestContext): Promise<T> => {
    if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context, { allowAppOwner }))) {
      throw new Denied();
    }
    return getter(parent);
  };
}

export const UsageSummaryResolvers: GQLResolvers & {
  UsageSummary: Required<GQLUsageSummaryResolvers>;
} = {
  UsageSummary: {
    __isTypeOf: (parent) => parent instanceof UsageSummaryModel,
    pk: makePrivate({}, (parent) => UsageSummaryPK.stringify(parent)),
    createdAt: makePrivate({}, (parent) => parent.createdAt),
    status: makePrivate({}, (parent) => parent.status),
    billedAt: makePrivate({}, (parent) => parent.billedAt),
    billed: makePrivate({}, (parent) => parent.billedAt !== undefined),
    // The volume is made viewable to the app owner so that in the app
    // owner's dashboard they can see they much their users are using.
    volume: makePrivate({ allowAppOwner: true }, (parent) => parent.volume),
    async subscriber(parent: UsageSummary, args: {}, context: RequestContext) {
      if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      return context.batched.User.get(UserPK.parse(parent.subscriber));
    },
    async app(parent: UsageSummary, args: {}, context: RequestContext) {
      if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      return context.batched.App.get(AppPK.parse(parent.app));
    },
    async billingRequestChargeAccountActivity(parent: UsageSummary, args: {}, context: RequestContext) {
      if (!(await Can.viewUsageSummaryPrivateAttributes(parent, context))) {
        throw new Denied();
      }
      if (parent.billingRequestChargeAccountActivity) {
        return context.batched.AccountActivity.getOrNull(
          AccountActivityPK.parse(parent.billingRequestChargeAccountActivity)
        );
      } else {
        return null;
      }
    },
  },
  Query: {
    async listUsageSummariesByAppSubscriber(
      parent: {},
      { subscriber, app, limit, dateRange }: GQLQueryListUsageSummariesByAppSubscriberArgs,
      context: RequestContext
    ) {
      if (!(await Can.listUsageSummariesByAppSubscriber({ subscriber }, context))) {
        throw new Denied();
      }
      const usageSummaries = await context.batched.UsageSummary.many(
        {
          subscriber,
          app,
          createdAt: dateRange
            ? {
                le: dateRange.end ?? undefined,
                ge: dateRange.start ?? undefined,
              }
            : undefined,
        },
        {
          limit: Math.min(limit || 1000, 1000),
          sort: "descending",
        }
      );
      return usageSummaries;
    },
  },
  Mutation: {
    /**
     * Used by the billing lambda to trigger billing.
     */
    async _sqsTriggerBilling(parent, args: GQLMutationTriggerBillingArgs, context) {
      const { user, app } = args;

      enforceCalledFromSQS(context, {
        queueName: SQSQueueName.UsageLogQueue,
        groupId: user,
      });

      if (!(await Can._sqsTriggerBilling(context))) {
        throw new Denied();
      }

      const result = await sqsTriggerBilling(context, { user, app });
      return result.affectedUsageSummaries;
    },

    async triggerBilling(parent, args: GQLMutationTriggerBillingArgs, context) {
      const { user, app } = args;

      if (!(await Can.triggerBilling(context))) {
        throw new Denied();
      }

      await getSQSClient({ queueName: SQSQueueName.UsageLogQueue, groupId: user }).mutate({
        mutation: graphql(`
          mutation CallSQSTriggerBilling($user: ID!, $app: ID!) {
            _sqsTriggerBilling(user: $user, app: $app) {
              pk
            }
          }
        `),
        variables: { user, app },
      });

      return true;
    },
  },
};
