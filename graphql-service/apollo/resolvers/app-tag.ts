import { RequestContext } from "../RequestContext";
import {
    GQLAppTagResolvers,
    GQLAppTagUpdateAppTagArgs,
    GQLMutationCreateAppTagArgs,
    GQLQueryAppTagsArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { AppTag, AppTagModel, AppTagTableIndex } from "../dynamoose/models";
import { BadInput, Denied } from "../errors";
import { updateAppSearchIndex } from "../functions/app";
import { Can } from "../permissions";

export const appTagResolvers: GQLResolvers & {
    AppTag: Required<GQLAppTagResolvers>;
} = {
    AppTag: {
        __isTypeOf: (parent) => parent instanceof AppTagModel,
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
            await context.batched.AppTag.delete(parent);
            return await context.batched.AppTag.create({
                app: parent.app,
                tag,
            });
        },
    },
    Query: {
        async appTags(parent: {}, { tag }: GQLQueryAppTagsArgs, context: RequestContext): Promise<AppTag[]> {
            if (!tag) {
                throw new BadInput("tag is required");
            }
            return await context.batched.AppTag.many(
                {
                    tag,
                },
                {
                    using: AppTagTableIndex.indexByTag_app__onlyPK,
                }
            );
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
