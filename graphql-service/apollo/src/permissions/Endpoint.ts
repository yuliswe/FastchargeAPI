import { GQLEndpointUpdateEndpointArgs, GQLMutationCreateEndpointArgs } from "@/src/__generated__/resolvers-types";
import { Endpoint } from "@/src/database/models/Endpoint";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { RequestContext } from "@/src/RequestContext";

export const EndpointPermissions = {
  async createEndpoint(
    { app: appPK, method, path, description, destination }: GQLMutationCreateEndpointArgs,
    context: RequestContext
  ): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    if (!context.currentUser) {
      return false;
    }
    const app = await context.batched.App.get(AppPK.parse(appPK));
    return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
  },
  async updateEndpoint(
    parent: Endpoint,
    { method, path, description, destination }: GQLEndpointUpdateEndpointArgs,
    context: RequestContext
  ): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    if (!context.currentUser) {
      return false;
    }
    const app = await context.batched.App.get(AppPK.parse(parent.app));
    return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
  },
  async deleteEndpoint(parent: Endpoint, args: never, context: RequestContext): Promise<boolean> {
    if (context.isServiceRequest || context.isAdminUser) {
      return true;
    }
    if (!context.currentUser) {
      return false;
    }
    const app = await context.batched.App.get(AppPK.parse(parent.app));
    return await Promise.resolve(app.owner === UserPK.stringify(context.currentUser));
  },
};
