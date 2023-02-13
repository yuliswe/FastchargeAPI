import { ApolloServer, BaseContext } from "@apollo/server";
import { readFileSync } from "fs";
import {
    App,
    AppModel,
    Endpoint,
    EndpointModel,
    PricingModel,
    StripePaymentAcceptModel,
    SubscribeModel,
    UsageLogModel,
    User,
    UserModel,
} from "./dynamoose/models";
import { GraphQLFormattedError } from "graphql";
import { formatDynamooseError } from "./dynamoose/error";
import { resolvers as scalarResolvers } from "graphql-scalars";
import { typeDefs as scalarTypeDefs } from "graphql-scalars";
import { appResolvers } from "./resolvers/app";
import { userResolvers } from "./resolvers/user";
import { initializeDB } from "./dynamoose";
import { GQLResolvers } from "./__generated__/resolvers-types";
import { Batched } from "./dynamoose/dataloader";
import { endpointResolvers } from "./resolvers/endpoint";
import { pricingResolvers } from "./resolvers/pricing";
import { subscribeResolvers } from "./resolvers/subscription";
import customScalars from "./scalars";
import { usageLogResolvers } from "./resolvers/usage";
import { stripePaymentAcceptResolvers } from "./resolvers/payment";
import { stripeTransferResolvers } from "./resolvers/transfer";

initializeDB();

// Add more models here when new models are created
export function createDefaultContextBatched() {
    return {
        User: new Batched(UserModel),
        App: new Batched(AppModel),
        Endpoint: new Batched(EndpointModel),
        Pricing: new Batched(PricingModel),
        Subscribe: new Batched(SubscribeModel),
        UsageLog: new Batched(UsageLogModel),
        StripePaymentAccept: new Batched(StripePaymentAcceptModel),
    };
}

export type RequestService = "payment" | "gateway" | "internal";

export interface RequestContext extends BaseContext {
    currentUser?: string;
    service?: RequestService;
    isServiceRequest: boolean;
    batched: ReturnType<typeof createDefaultContextBatched>;
}

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
    Query: {
        ...appResolvers.Query,
        ...userResolvers.Query,
        ...endpointResolvers.Query,
        ...subscribeResolvers.Query,
        ...pricingResolvers.Query,
        ...usageLogResolvers.Query,
        ...stripePaymentAcceptResolvers.Query,
        ...stripeTransferResolvers.Query,
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
