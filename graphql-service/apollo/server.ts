import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { readFileSync } from "fs";
import { resolvers as scalarResolvers, typeDefs as scalarTypeDefs } from "graphql-scalars";
import process from "node:process";
import { RequestContext } from "./RequestContext";
import { GQLResolvers } from "./__generated__/resolvers-types";
import { wakeUpAurora } from "./aurora";
import { handleError } from "./errors";
import { accountActivityResolvers } from "./resolvers/account";
import { accountHistoryResolvers } from "./resolvers/account-history";
import { appResolvers } from "./resolvers/app";
import { appTagResolvers } from "./resolvers/app-tag";
import { endpointResolvers } from "./resolvers/endpoint";
import { gatewayResolvers } from "./resolvers/gateway";
import { stripePaymentAcceptResolvers } from "./resolvers/payment";
import { pricingResolvers } from "./resolvers/pricing";
import { secretResolvers } from "./resolvers/secret";
import { subscriptionResolvers } from "./resolvers/subscription";
import { userAppTokenResolvers } from "./resolvers/token";
import { stripeTransferResolvers } from "./resolvers/transfer";
import { usageLogResolvers } from "./resolvers/usage";
import { usageSummaryResolvers } from "./resolvers/usage-sum";
import { userResolvers } from "./resolvers/user";
import customScalars from "./scalars";

// This will prevent NodeJS from crashing when an unhandled promise rejection
// occurs.
process.on("uncaughtException", (err, origin) => {
    console.error(err);
    console.error(origin);
});

// Add more resolvers here when new resolvers are created
const resolvers: GQLResolvers = {
    ...scalarResolvers,
    ...customScalars,
    App: appResolvers.App,
    AppTag: appTagResolvers.AppTag,
    User: userResolvers.User,
    Endpoint: endpointResolvers.Endpoint,
    Subscribe: subscriptionResolvers.Subscribe,
    UsageLog: usageLogResolvers.UsageLog,
    StripePaymentAccept: stripePaymentAcceptResolvers.StripePaymentAccept,
    StripeTransfer: stripeTransferResolvers.StripeTransfer,
    Pricing: pricingResolvers.Pricing,
    UsageSummary: usageSummaryResolvers.UsageSummary,
    Secret: secretResolvers.Secret,
    AccountHistory: accountHistoryResolvers.AccountHistory,
    AccountActivity: accountActivityResolvers.AccountActivity,
    UserAppToken: userAppTokenResolvers.UserAppToken,
    Query: {
        ...gatewayResolvers.Query,
        ...appResolvers.Query,
        ...appTagResolvers.Query,
        ...userResolvers.Query,
        ...endpointResolvers.Query,
        ...subscriptionResolvers.Query,
        ...pricingResolvers.Query,
        ...usageLogResolvers.Query,
        ...stripePaymentAcceptResolvers.Query,
        ...stripeTransferResolvers.Query,
        ...pricingResolvers.Query,
        ...usageSummaryResolvers.Query,
        ...secretResolvers.Query,
        ...accountHistoryResolvers.Query,
        ...accountActivityResolvers.Query,
        ...userAppTokenResolvers.Query,
    },
    Mutation: {
        ...gatewayResolvers.Mutation,
        ...appResolvers.Mutation,
        ...appTagResolvers.Mutation,
        ...userResolvers.Mutation,
        ...endpointResolvers.Mutation,
        ...subscriptionResolvers.Mutation,
        ...pricingResolvers.Mutation,
        ...usageLogResolvers.Mutation,
        ...stripePaymentAcceptResolvers.Mutation,
        ...stripeTransferResolvers.Mutation,
        ...pricingResolvers.Mutation,
        ...usageSummaryResolvers.Mutation,
        ...secretResolvers.Mutation,
        ...accountHistoryResolvers.Mutation,
        ...accountActivityResolvers.Mutation,
        ...userAppTokenResolvers.Mutation,

        async ping(): Promise<boolean> {
            await wakeUpAurora();
            return true;
        },
    },
};

const typeDefs = [readFileSync("./schema/App.graphql", { encoding: "utf-8" }), ...scalarTypeDefs];

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
export const server = new ApolloServer<RequestContext>({
    typeDefs,
    resolvers,
    includeStacktraceInErrorResponses: true,
    formatError: handleError,
    plugins: [
        ApolloServerPluginCacheControl({
            defaultMaxAge: 60, // cache for 1 second
        }),
    ],
});
