import { Endpoint, EndpointModel } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLEndpointResolvers,
    GQLEndpointUpdateEndpointArgs,
    GQLHttpMethod,
    GQLMutationCreateEndpointArgs,
    GQLQueryEndpointArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { EndpointPK } from "../pks/EndpointPK";

export const endpointResolvers: GQLResolvers & {
    Endpoint: Required<GQLEndpointResolvers>;
} = {
    Endpoint: {
        __isTypeOf: (parent) => parent instanceof EndpointModel,
        pk: (parent) => EndpointPK.stringify(parent),
        method: (parent) => parent.method as GQLHttpMethod,
        description: (parent) => parent.description,
        destination: (parent) => parent.destination,
        createdAt: (parent) => parent.createdAt,
        updatedAt: (parent) => parent.updatedAt,
        path: ({ path }) => path,

        async updateEndpoint(
            parent: Endpoint,
            {
                method,
                path,
                description,
                destination,
            }: GQLEndpointUpdateEndpointArgs,
            context: RequestContext
        ) {
            if (!(await Can.updateEndpoint(parent, context))) {
                throw new Denied();
            }
            return await context.batched.Endpoint.update(parent, {
                method,
                path,
                description,
                destination,
            });
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
            { pk, app, path, ...newVals }: GQLQueryEndpointArgs,
            context,
            info
        ) {
            let endpoint: Endpoint;
            if (pk) {
                endpoint = await context.batched.Endpoint.get(
                    EndpointPK.parse(pk)
                );
            } else {
                endpoint = await context.batched.Endpoint.get({ app, path });
            }
            if (!(await Can.viewEndpoint(endpoint, context))) {
                throw new Denied();
            }
            return endpoint;
        },
    },
    Mutation: {
        async createEndpoint(
            parent: {},
            {
                app,
                path,
                method,
                description,
                destination,
            }: GQLMutationCreateEndpointArgs,
            context,
            info
        ) {
            await context.batched.App.get(app); // checks if app exists
            if (
                !(await Can.createEndpoint(
                    { app, path, method, description, destination },
                    context
                ))
            ) {
                throw new Denied();
            }
            let endpoint = await context.batched.Endpoint.create({
                app,
                path,
                method,
                description,
                destination,
            });
            return endpoint;
        },
    },
};
