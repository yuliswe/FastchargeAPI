import { RequestContext } from "@/src/RequestContext";
import {
  GQLAppTagResolvers,
  GQLMutationCreateAppTagArgs,
  GQLQueryGetAppTagArgs,
  GQLQueryListAppTagsByAppArgs,
  GQLResolvers,
} from "@/src/__generated__/resolvers-types";
import { AppTag, AppTagModel } from "@/src/database/models/AppTag";
import { Denied } from "@/src/errors";
import { updateAppSearchIndex } from "@/src/functions/app";
import { Can } from "@/src/permissions";
import { AppPK } from "@/src/pks/AppPK";
import { AppTagPK } from "@/src/pks/AppTagPK";

export const AppTagResolvers: GQLResolvers & {
  AppTag: Required<GQLAppTagResolvers>;
} = {
  AppTag: {
    __isTypeOf: (parent) => parent instanceof AppTagModel,
    pk: (parent) => AppTagPK.stringify(parent),
    app: (parent: AppTag, args: {}, context: RequestContext) => context.batched.App.get(AppPK.parse(parent.app)),
    tag: (parent: AppTag) => parent.tag,
    createdAt: (parent: AppTag) => parent.createdAt,
    updatedAt: (parent: AppTag) => parent.updatedAt,

    async deleteAppTag(parent: AppTag, args: {}, context: RequestContext): Promise<AppTag> {
      if (!(await Can.deleteAppTag(parent, context))) {
        throw new Denied();
      }
      return await context.batched.AppTag.delete(parent);
    },
  },
  Query: {
    async listAppTagsByApp(
      parent: {},
      { app }: GQLQueryListAppTagsByAppArgs,
      context: RequestContext
    ): Promise<AppTag[]> {
      return await context.batched.AppTag.many({
        app,
      });
    },

    async getAppTag(parent: {}, { pk }: GQLQueryGetAppTagArgs, context: RequestContext) {
      return await context.batched.AppTag.get(AppTagPK.parse(pk));
    },
  },
  Mutation: {
    async createAppTag(
      parent: {},
      { app, tag }: GQLMutationCreateAppTagArgs,
      context: RequestContext
    ): Promise<AppTag> {
      if (!(await Can.createAppTag(context))) {
        throw new Denied();
      }
      const appObject = await context.batched.App.get(AppPK.parse(app));
      const tagObject = await context.batched.AppTag.createOverwrite({
        app,
        tag,
      });
      await updateAppSearchIndex(context, [appObject]);
      return tagObject;
    },
  },
};
