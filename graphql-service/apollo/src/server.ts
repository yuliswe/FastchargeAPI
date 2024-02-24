import { RequestContext } from "@/src/RequestContext";
import { GQLResolvers } from "@/src/__generated__/resolvers-types";
import { wakeUpAurora } from "@/src/database/aurora";
import { handleError } from "@/src/errors";
import { getGraphQLAst } from "@/src/getGraphQLAst";
import { AccountActivityResolvers } from "@/src/resolvers/AccountActivity";
import { AccountHistoryResolvers } from "@/src/resolvers/AccountHistory";
import { AppResolvers } from "@/src/resolvers/App";
import { AppTagResolvers } from "@/src/resolvers/AppTag";
import { EndpointResolvers } from "@/src/resolvers/Endpoint";
import { GatewayResolvers } from "@/src/resolvers/Gateway";
import { PricingResolvers } from "@/src/resolvers/Pricing";
import { SecretResolvers } from "@/src/resolvers/Secret";
import { SiteMetaDataResolvers } from "@/src/resolvers/SiteMetaData";
import { StripePaymentAcceptResolvers } from "@/src/resolvers/StripePaymentAccept";
import { StripeTransferResolvers } from "@/src/resolvers/StripeTransfer";
import { SubscriptionResolvers } from "@/src/resolvers/Subscription";
import { UsageLogResolvers } from "@/src/resolvers/UsageLog";
import { UsageSummaryResolvers } from "@/src/resolvers/UsageSummary";
import { UserResolvers } from "@/src/resolvers/User";
import { UserAppTokenResolvers } from "@/src/resolvers/UserAppToken";
import AppGraphQLSchema from "@/src/schema/Public.graphql";
import customScalars from "@/src/schema/scalars";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { resolvers as scalarResolvers, typeDefs as scalarTypeDefs } from "graphql-scalars";
import process from "node:process";

// This will prevent NodeJS from crashing when an unhandled promise rejection
// occurs.
process.on("uncaughtException", (err, origin) => {
  console.error(err);
  console.error(origin);
});

// Add more resolvers here when new resolvers are created
function getResolvers(): GQLResolvers {
  const resolvers = {
    ...scalarResolvers,
    ...customScalars,
    App: AppResolvers.App,
    AppTag: AppTagResolvers.AppTag,
    User: UserResolvers.User,
    Endpoint: EndpointResolvers.Endpoint,
    Subscribe: SubscriptionResolvers.Subscribe,
    UsageLog: UsageLogResolvers.UsageLog,
    StripePaymentAccept: StripePaymentAcceptResolvers.StripePaymentAccept,
    StripeTransfer: StripeTransferResolvers.StripeTransfer,
    Pricing: PricingResolvers.Pricing,
    UsageSummary: UsageSummaryResolvers.UsageSummary,
    Secret: SecretResolvers.Secret,
    AccountHistory: AccountHistoryResolvers.AccountHistory,
    AccountActivity: AccountActivityResolvers.AccountActivity,
    UserAppToken: UserAppTokenResolvers.UserAppToken,
    SiteMetaData: SiteMetaDataResolvers.SiteMetaData,
    Query: {
      ...GatewayResolvers.Query,
      ...AppResolvers.Query,
      ...AppTagResolvers.Query,
      ...UserResolvers.Query,
      ...EndpointResolvers.Query,
      ...SubscriptionResolvers.Query,
      ...PricingResolvers.Query,
      ...UsageLogResolvers.Query,
      ...StripePaymentAcceptResolvers.Query,
      ...StripeTransferResolvers.Query,
      ...PricingResolvers.Query,
      ...UsageSummaryResolvers.Query,
      ...SecretResolvers.Query,
      ...AccountHistoryResolvers.Query,
      ...AccountActivityResolvers.Query,
      ...UserAppTokenResolvers.Query,
      ...SiteMetaDataResolvers.Query,
    },
    Mutation: {
      ...GatewayResolvers.Mutation,
      ...AppResolvers.Mutation,
      ...AppTagResolvers.Mutation,
      ...UserResolvers.Mutation,
      ...EndpointResolvers.Mutation,
      ...SubscriptionResolvers.Mutation,
      ...PricingResolvers.Mutation,
      ...UsageLogResolvers.Mutation,
      ...StripePaymentAcceptResolvers.Mutation,
      ...StripeTransferResolvers.Mutation,
      ...PricingResolvers.Mutation,
      ...UsageSummaryResolvers.Mutation,
      ...SecretResolvers.Mutation,
      ...AccountHistoryResolvers.Mutation,
      ...AccountActivityResolvers.Mutation,
      ...UserAppTokenResolvers.Mutation,
      ...SiteMetaDataResolvers.Mutation,

      ping(): boolean {
        void wakeUpAurora().catch((err) => {
          console.error(err);
        });
        return true;
      },
    },
  };

  resolvers.Mutation = {
    ...resolvers.Mutation,
    ...resolvers.Query,
  };

  return resolvers;
}

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
export function getServer() {
  return new ApolloServer<RequestContext>({
    typeDefs: [getGraphQLAst(AppGraphQLSchema), ...scalarTypeDefs],
    resolvers: getResolvers(),
    includeStacktraceInErrorResponses: true,
    formatError: handleError,
    plugins: [
      ApolloServerPluginCacheControl({
        defaultMaxAge: 60, // cache for 1 second
      }),
    ],
  });
}
