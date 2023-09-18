import { AppTagPK } from "@/pks/AppTagPK";
import { RequestContext } from "../RequestContext";
import {
    GQLAppTagResolvers,
    GQLAppTagUpdateAppTagArgs,
    GQLMutationCreateAppTagArgs,
    GQLQueryListAppTagsByAppArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { AppTag, AppTagModel } from "../database/models";
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

        async updateAppTag(
            parent: AppTag,
            { tag }: GQLAppTagUpdateAppTagArgs,
            context: RequestContext
        ): Promise<AppTag> {
            if (!(await Can.updateAppTag(parent, { tag }, context))) {
                throw new Denied();
            }
            if (tag) {
                await context.batched.AppTag.delete(parent);
                return await context.batched.AppTag.create({
                    app: parent.app,
                    tag,
                });
            }
            return parent;
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
            const tag = await context.batched.AppTag.getOrCreate({
                app: appName,
                tag: tagName,
            });
            await updateAppSearchIndex(context, [app]);
            return tag;
        },
    },
};
