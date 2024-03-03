import { RequestContext } from "@/src/RequestContext";
import {
  GQLEndpointResolvers,
  GQLEndpointUpdateEndpointArgs,
  GQLMutationCreateEndpointArgs,
  GQLQueryGetEndpointArgs,
  GQLQueryListEndpointsByAppArgs,
  GQLResolvers,
} from "@/src/__generated__/resolvers-types";
import { Endpoint, EndpointModel } from "@/src/database/models/Endpoint";
import { Denied } from "@/src/errors";
import { Can } from "@/src/permissions";
import { AppPK } from "@/src/pks/AppPK";
import { EndpointPK } from "@/src/pks/EndpointPK";

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
        deletedAt: new Date(),
      });
    },
  },
  Query: {
    async getEndpoint(parent: {}, { pk }: GQLQueryGetEndpointArgs, context, info) {
      return await context.batched.Endpoint.get(EndpointPK.parse(pk));
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
