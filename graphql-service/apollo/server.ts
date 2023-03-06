import { ApolloServer } from "@apollo/server";
import { readFileSync } from "fs";
import { GraphQLFormattedError } from "graphql";
import { formatDynamooseError } from "./dynamoose/error";
import { resolvers as scalarResolvers } from "graphql-scalars";
import { typeDefs as scalarTypeDefs } from "graphql-scalars";
import { appResolvers } from "./resolvers/app";
import { userResolvers } from "./resolvers/user";
import { initializeDB } from "./dynamoose";
import { GQLResolvers } from "./__generated__/resolvers-types";
import { endpointResolvers } from "./resolvers/endpoint";
import { pricingResolvers } from "./resolvers/pricing";
import { subscribeResolvers } from "./resolvers/subscription";
import customScalars from "./scalars";
import { usageLogResolvers } from "./resolvers/usage";
import { stripePaymentAcceptResolvers } from "./resolvers/payment";
import { stripeTransferResolvers } from "./resolvers/transfer";
import { RequestContext } from "./RequestContext";
import { usageSummaryResolvers } from "./resolvers/usage-sum";
import { secretResolvers } from "./resolvers/secret";
import { accountHistoryResolvers } from "./resolvers/account-history";
import { accountActivityResolvers } from "./resolvers/account";

initializeDB();

// Add more resolvers here when new resolvers are created
const resolvers: GQLResolvers = {
    ...scalarResolvers,
    ...customScalars,
    App: appResolvers.App,
    User: userResolvers.User,
    Endpoint: endpointResolvers.Endpoint,
    Subscribe: subscribeResolvers.Subscribe,
    UsageLog: usageLogResolvers.UsageLog,
    StripePaymentAccept: stripePaymentAcceptResolvers.StripePaymentAccept,
    StripeTransfer: stripeTransferResolvers.StripeTransfer,
    Pricing: pricingResolvers.Pricing,
    UsageSummary: usageSummaryResolvers.UsageSummary,
    Secret: secretResolvers.Secret,
    AccountHistory: accountHistoryResolvers.AccountHistory,
    AccountActivity: accountActivityResolvers.AccountActivity,
    Query: {
        ...appResolvers.Query,
        ...userResolvers.Query,
        ...endpointResolvers.Query,
        ...subscribeResolvers.Query,
        ...pricingResolvers.Query,
        ...usageLogResolvers.Query,
        ...stripePaymentAcceptResolvers.Query,
        ...stripeTransferResolvers.Query,
        ...pricingResolvers.Query,
        ...usageSummaryResolvers.Query,
        ...secretResolvers.Query,
        ...accountHistoryResolvers.Query,
        ...accountActivityResolvers.Query,
    },
    Mutation: {
        ...appResolvers.Mutation,
        ...userResolvers.Mutation,
        ...endpointResolvers.Mutation,
        ...subscribeResolvers.Mutation,
        ...pricingResolvers.Mutation,
        ...usageLogResolvers.Mutation,
        ...stripePaymentAcceptResolvers.Mutation,
        ...stripeTransferResolvers.Mutation,
        ...pricingResolvers.Mutation,
        ...usageSummaryResolvers.Mutation,
        ...secretResolvers.Mutation,
        ...accountHistoryResolvers.Mutation,
        ...accountActivityResolvers.Mutation,
    },
};

const typeDefs = [
    readFileSync("./schema/App.graphql", { encoding: "utf-8" }),
    ...scalarTypeDefs,
];

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
export const server = new ApolloServer<RequestContext>({
    typeDefs,
    resolvers,
    includeStacktraceInErrorResponses: true,
    formatError(formattedError, error): GraphQLFormattedError {
        return formatDynamooseError(formattedError, error);
    },
});
