import { AppTag, AppTagModel } from "@/database/models/AppTag";
import { AppTagPK } from "@/pks/AppTagPK";
import { RequestContext } from "../RequestContext";
import {
    GQLAppTagResolvers,
    GQLMutationCreateAppTagArgs,
    GQLQueryGetAppTagArgs,
    GQLQueryListAppTagsByAppArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { updateAppSearchIndex } from "../functions/app";
import { Can } from "../permissions";

export const AppTagResolvers: GQLResolvers & {
    AppTag: Required<GQLAppTagResolvers>;
} = {
    AppTag: {
        __isTypeOf: (parent) => parent instanceof AppTagModel,
        pk: (parent) => AppTagPK.stringify(parent),
        app: (parent: AppTag, args: {}, context: RequestContext) => context.batched.App.get({ name: parent.app }),
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
            { app: appName, tag: tagName }: GQLMutationCreateAppTagArgs,
            context: RequestContext
        ): Promise<AppTag> {
            if (!(await Can.createAppTag(context))) {
                throw new Denied();
            }
            const app = await context.batched.App.get({ name: appName });
            const tag = await context.batched.AppTag.createOverwrite({
                app: appName,
                tag: tagName,
            });
            await updateAppSearchIndex(context, [app]);
            return tag;
        },
    },
};
