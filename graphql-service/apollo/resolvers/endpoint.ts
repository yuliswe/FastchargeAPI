import { GraphQLResolveInfo } from "graphql";
import { Endpoint } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLEndpointUpdateEndpointArgs,
    GQLMutationCreateEndpointArgs,
    GQLQueryEndpointArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";

export const endpointResolvers: GQLResolvers = {
    Endpoint: {
        async description({ app, path }, args, context, info) {
            let endpoint = await context.batched.Endpoint.get({ app, path });
            return endpoint.description || "";
        },
        async destination({ app, path }, args, context, info) {
            let endpoint = await context.batched.Endpoint.get({ app, path });
            return endpoint.destination || "";
        },
        path: ({ path }) => path,
        ref: ({ app, path }) =>
            Buffer.from(JSON.stringify({ app, path })).toString("base64url"),
        async updateEndpoint(
            parent: Endpoint,
            args: GQLEndpointUpdateEndpointArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ) {
            if (!(await Can.updateEndpoint(args, context))) {
                throw new Denied();
            }
            // Primary key cannot be updated. So we need to delete the old one
            // and create a new one if we want to change the path.
            if (args.path && args.path !== parent.path) {
                let old = await context.batched.Endpoint.delete(parent);
                return await context.batched.Endpoint.create({
                    ...old,
                    ...args,
                });
            } else {
                return await context.batched.Endpoint.update(parent, args);
            }
        },
        async deleteEndpoint(parent, args: never, context, info) {
            if (!(await Can.deleteEndpoint(parent, args, context))) {
                throw new Denied();
            }
            await context.batched.Endpoint.delete(parent);
            return parent;
        },
    },
    Query: {
        async endpoint(
            parent: {},
            { ref, app, path, ...newVals }: GQLQueryEndpointArgs,
            context,
            info
        ) {
            if (ref) {
                let parsed = JSON.parse(
                    Buffer.from(ref, "base64url").toString("utf8")
                );
                app = parsed.app;
                path = parsed.path;
            }
            let endpoint = await context.batched.Endpoint.get({ app, path });
            if (!(await Can.viewEndpoint(endpoint, context))) {
                throw new Denied();
            }
            return endpoint;
        },
    },
    Mutation: {
        async createEndpoint(
            parent: {},
            args: GQLMutationCreateEndpointArgs,
            context,
            info
        ) {
            await context.batched.App.get(args.app); // checks if app exists
            if (!(await Can.createEndpoint(args, context))) {
                throw new Denied();
            }
            let endpoint = await context.batched.Endpoint.create(args);
            return endpoint;
        },
    },
};
