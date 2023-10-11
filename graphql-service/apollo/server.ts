import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { resolvers as scalarResolvers, typeDefs as scalarTypeDefs } from "graphql-scalars";
import process from "node:process";
import { RequestContext } from "./RequestContext";
import { GQLResolvers } from "./__generated__/resolvers-types";
import { wakeUpAurora } from "./database/aurora";
import { handleError } from "./errors";
import { getGraphQLAst } from "./getGraphQLAst";
import { AccountActivityResolvers } from "./resolvers/AccountActivity";
import { AccountHistoryResolvers } from "./resolvers/AccountHistory";
import { AppResolvers } from "./resolvers/App";
import { AppTagResolvers } from "./resolvers/AppTag";
import { EndpointResolvers } from "./resolvers/Endpoint";
import { GatewayResolvers } from "./resolvers/Gateway";
import { PricingResolvers } from "./resolvers/Pricing";
import { SecretResolvers } from "./resolvers/Secret";
import { SiteMetaDataResolvers } from "./resolvers/SiteMetaData";
import { StripePaymentAcceptResolvers } from "./resolvers/StripePaymentAccept";
import { StripeTransferResolvers } from "./resolvers/StripeTransfer";
import { SubscriptionResolvers } from "./resolvers/Subscription";
import { UsageLogResolvers } from "./resolvers/UsageLog";
import { UsageSummaryResolvers } from "./resolvers/UsageSummary";
import { UserResolvers } from "./resolvers/User";
import { UserAppTokenResolvers } from "./resolvers/UserAppToken";
import AppGraphQLSchema from "./schema/Public.graphql";
import customScalars from "./schema/scalars";

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
