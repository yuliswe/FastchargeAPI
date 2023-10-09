import { Endpoint, EndpointModel } from "@/database/models/Endpoint";
import { AppPK } from "@/pks/AppPK";
import { RequestContext } from "../RequestContext";
import {
    GQLEndpointResolvers,
    GQLEndpointUpdateEndpointArgs,
    GQLMutationCreateEndpointArgs,
    GQLQueryEndpointArgs,
    GQLQueryGetEndpointArgs,
    GQLQueryListEndpointsByAppArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
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

export const EndpointResolvers: GQLResolvers & {
    Endpoint: Required<GQLEndpointResolvers>;
} = {
    Endpoint: {
        __isTypeOf: (parent) => parent instanceof EndpointModel,

        /**************************
         * All public attributes
         **************************/

        pk: (parent) => EndpointPK.stringify(parent),
        method: (parent) => parent.method,
        description: (parent) => parent.description,
        path: ({ path }) => path,
        app: (parent, args: {}, context) => context.batched.App.get(AppPK.parse(parent.app)),
        deleted: (parent) => parent.deleted,
        deletedAt: (parent) => parent.deletedAt,

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
                method: method ?? undefined,
                path: path ?? undefined,
                description: description ?? undefined,
                destination: destination ?? undefined,
            });
        },
        async deleteEndpoint(parent, args: never, context, info) {
            if (!(await Can.deleteEndpoint(parent, args, context))) {
                throw new Denied();
            }
            return await context.batched.Endpoint.update(parent, {
                deleted: true,
                deletedAt: Date.now(),
            });
        },
    },
    Query: {
        async getEndpoint(parent: {}, { pk }: GQLQueryGetEndpointArgs, context, info) {
            return await context.batched.Endpoint.get(EndpointPK.parse(pk));
        },

        async endpoint(parent: {}, { pk, app, path }: GQLQueryEndpointArgs, context, info) {
            if (pk) {
                return EndpointResolvers.Query!.getEndpoint!(parent, { pk }, context, info);
            }

            if (app && path) {
                return EndpointResolvers.Query!.getEndpointByApp!(parent, { app, path }, context, info);
            }

            throw new BadInput("Must provide either pk or app+path");
        },

        async listEndpointsByApp(parent: {}, { app }: GQLQueryListEndpointsByAppArgs, context: RequestContext) {
            const endpoints = await context.batched.Endpoint.many({
                app,
                deleted: false,
            });
            return endpoints;
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
                destination,
                description: description ?? undefined,
            });
            return endpoint;
        },
    },
};

/* Deprecated */
EndpointResolvers.Query!.endpoint = EndpointResolvers.Query?.getEndpoint;
