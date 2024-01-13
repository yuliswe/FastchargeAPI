import { App } from "@/database/models/App";
import { AppTagTableIndex } from "@/database/models/AppTag";
import { GraphQLResolveInfoWithCacheControl } from "@apollo/cache-control-types";
import { RequestContext } from "../RequestContext";
import {
  GQLAppResolvers,
  GQLAppUpdateAppArgs,
  GQLMutationCreateAppArgs,
  GQLQueryAppArgs,
  GQLQueryAppFullTextSearchArgs,
  GQLQueryGetAppArgs,
  GQLQueryGetAppByNameArgs,
  GQLQueryListAppsByTagArgs,
  GQLResolvers,
} from "../__generated__/resolvers-types";
import { Denied, ResourceDeleted, TooManyResources } from "../errors";
import { appFullTextSearch, flushAppSearchIndex, updateAppSearchIndex, validateAppName } from "../functions/app";
import { Can } from "../permissions";
import { AppPK } from "../pks/AppPK";
import { UserPK } from "../pks/UserPK";
import { AppTagResolvers } from "./AppTag";
import { EndpointResolvers } from "./Endpoint";
import { PricingResolvers } from "./Pricing";

export const AppResolvers: GQLResolvers & {
  App: GQLAppResolvers;
} = {
  App: {
    /**************************
     * All public attributes
     **************************/
    pk: (parent) => AppPK.stringify(parent),
    name: (parent) => parent.name,
    title: (parent) => parent.title,
    createdAt: (parent) => parent.createdAt,
    updatedAt: (parent) => parent.updatedAt,
    description: (parent) => parent.description,
    repository: (parent) => parent.repository,
    homepage: (parent) => parent.homepage,
    readme: (parent) => parent.readme,
    gatewayMode: (parent) => parent.gatewayMode,
    deleted: (parent) => parent.deleted,
    deletedAt: (parent) => parent.deletedAt,
    async owner(parent, args, context, info) {
      const user = await context.batched.User.get(UserPK.parse(parent.owner));
      return user;
    },
    async pricingPlans(parent: App, args: {}, context: RequestContext, info: GraphQLResolveInfoWithCacheControl) {
      const listPricings = PricingResolvers.Query!.listPricingsByApp!;
      return listPricings(
        {},
        {
          app: AppPK.stringify(parent),
        },
        context,
        info
      );
    },
    async endpoints(parent, args, context, info: GraphQLResolveInfoWithCacheControl) {
      return EndpointResolvers.Query!.listEndpointsByApp!(
        {},
        {
          app: AppPK.stringify(parent),
        },
        context,
        info
      );
    },

    async tags(parent: App, args: {}, context: RequestContext, info: GraphQLResolveInfoWithCacheControl) {
      const listAppTagsByApp = AppTagResolvers.Query!.listAppTagsByApp!;
      return await listAppTagsByApp({}, { app: AppPK.stringify(parent) }, context, info);
    },

    async updateApp(
      parent: App,
      { title, description, homepage, repository, readme, visibility }: GQLAppUpdateAppArgs,
      context: RequestContext
    ): Promise<App> {
      if (!(await Can.updateApp(parent, { title, description, homepage, repository }, context))) {
        throw new Denied();
      }
      const app = await context.batched.App.update(parent, {
        title: title ?? undefined,
        description: description ?? undefined,
        homepage: homepage ?? undefined,
        repository: repository ?? undefined,
        readme: readme ?? undefined,
        visibility: visibility ?? undefined,
      });
      await updateAppSearchIndex(context, [app]);
      return app;
    },

    async deleteApp(parent: App, args: never, context: RequestContext): Promise<App> {
      if (!(await Can.deleteApp(parent, context))) {
        throw new Denied();
      }
      return await context.batched.App.update(parent, {
        deleted: true,
        deletedAt: Date.now(),
      });
    },

    /**************************
     * All private attributes
     **************************/
  },
  Query: {
    async getApp(parent: {}, { pk }: GQLQueryGetAppArgs, context: RequestContext): Promise<App> {
      const app = await context.batched.App.get(AppPK.parse(pk));
      if (app.deleted) {
        throw new ResourceDeleted("App");
      }
      return app;
    },
    async getAppByName(parent: {}, { name }: GQLQueryGetAppByNameArgs, context: RequestContext): Promise<App> {
      const app = await context.batched.App.get({ name });
      if (app.deleted) {
        throw new ResourceDeleted("App");
      }
      return app;
    },
    async app(parent: {}, { pk, name }: GQLQueryAppArgs, context: RequestContext): Promise<App> {
      if (pk) {
        return await context.batched.App.get(AppPK.parse(pk));
      } else if (name) {
        return await context.batched.App.get({ name });
      }
      throw new Error("Either pk or name must be provided");
    },
    async appFullTextSearch(
      parent: {},
      { query, tag, orderBy, limit, offset }: GQLQueryAppFullTextSearchArgs,
      context: RequestContext
    ): Promise<App[]> {
      return await appFullTextSearch(context, {
        query,
        tag,
        orderBy,
        limit,
        offset,
      });
    },
    async listAppsByTag(
      parent: {},
      { tag, limit = 10 }: GQLQueryListAppsByTagArgs,
      context: RequestContext
    ): Promise<App[]> {
      // Each AppTag object contains an app PK
      const appTags = await context.batched.AppTag.many(
        { tag },
        {
          limit,
          using: AppTagTableIndex.TagApp,
        }
      );
      const apps = await Promise.all(appTags.map((tag) => context.batched.App.get(AppPK.parse(tag.app))));
      return apps.filter((app) => !app.deleted);
    },
  },
  Mutation: {
    async createApp(
      parent: {},
      {
        owner,
        name,
        title,
        description,
        gatewayMode,
        homepage,
        repository,
        visibility,
        logo,
      }: GQLMutationCreateAppArgs,
      context: RequestContext
    ): Promise<App> {
      if (!(await Can.createApp({ owner }, context))) {
        throw new Denied();
      }

      validateAppName(name);
      // Each user can have at most 10 apps
      const count = await context.batched.App.count({ owner });
      if (count >= 10) {
        throw new TooManyResources("You can only have 10 apps");
      }
      const app = await context.batched.App.create({
        name,
        owner,
        title: title ?? undefined,
        description: description ?? undefined,
        gatewayMode: gatewayMode ?? undefined,
        homepage: homepage ?? undefined,
        repository: repository ?? undefined,
        visibility: visibility ?? undefined,
        logo: logo ?? undefined,
      });
      await updateAppSearchIndex(context, [app]);
      return app;
    },

    async flushAppSearchIndex(parent: {}, args: {}, context: RequestContext) {
      if (!(await Can.flushAppSearchIndex(context))) {
        throw new Denied();
      }
      return await flushAppSearchIndex(context);
    },
  },
};

/* Deprecated */
AppResolvers.Query!.apps = AppResolvers.Query!.listAppsByTag;
