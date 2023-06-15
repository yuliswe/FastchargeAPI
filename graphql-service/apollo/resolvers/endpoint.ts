import { RequestContext } from "../RequestContext";
import {
    GQLEndpointResolvers,
    GQLEndpointUpdateEndpointArgs,
    GQLHttpMethod,
    GQLMutationCreateEndpointArgs,
    GQLQueryEndpointArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { Endpoint, EndpointModel } from "../dynamoose/models";
import { BadInput, Denied } from "../errors";
import { Can } from "../permissions";
import { EndpointPK } from "../pks/EndpointPK";

function makeOwnerReadable<T>(
    getter: (parent: Endpoint, args: {}, context: RequestContext) => T
): (parent: Endpoint, args: {}, context: RequestContext) => Promise<T> {
    return async (parent: Endpoint, args: {}, context: RequestContext): Promise<T> => {
        if (!(await Can.viewPrivateEndpointArributes(parent, context))) {
            throw new Denied();
        }
        return getter(parent, args, context);
    };
}

export const endpointResolvers: GQLResolvers & {
    Endpoint: Required<GQLEndpointResolvers>;
} = {
    Endpoint: {
        __isTypeOf: (parent) => parent instanceof EndpointModel,

        /**************************
         * All public attributes
         **************************/

        pk: (parent) => EndpointPK.stringify(parent),
        method: (parent) => parent.method as GQLHttpMethod,
        description: (parent) => parent.description,
        path: ({ path }) => path,

        /***********************************************
         * All arributes only readable by the app owner
         ***********************************************/

        createdAt: makeOwnerReadable((parent) => parent.createdAt),
        updatedAt: makeOwnerReadable((parent) => parent.updatedAt),
        destination: makeOwnerReadable((parent) => parent.destination),

        async updateEndpoint(
            parent: Endpoint,
            { method, path, description, destination }: GQLEndpointUpdateEndpointArgs,
            context: RequestContext
        ) {
            if (!(await Can.updateEndpoint(parent, { method, path, description, destination }, context))) {
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
        /**
         * Offers an API to look up endpoints by either their primary key or by app+path.
         */
        async endpoint(parent: {}, { pk, app, path }: GQLQueryEndpointArgs, context, info) {
            if (!pk && !app) {
                throw new BadInput("Must provide either pk or app");
            }
            let endpoint: Endpoint;
            if (pk) {
                endpoint = await context.batched.Endpoint.get(EndpointPK.parse(pk));
            } else {
                endpoint = await context.batched.Endpoint.get({ app, path });
            }
            return endpoint;
        },
    },
    Mutation: {
        async createEndpoint(
            parent: {},
            { app, path, method, description, destination }: GQLMutationCreateEndpointArgs,
            context,
            info
        ) {
            if (!(await Can.createEndpoint({ app, path, method, description, destination }, context))) {
                throw new Denied();
            }
            const endpoint = await context.batched.Endpoint.create({
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
