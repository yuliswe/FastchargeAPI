import { SiteMetaData, SiteMetaDataModel } from "@/database/models/SiteMetaData";
import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateSiteMetaDataArgs,
    GQLQueryGetSiteMetaDataByKeyArgs,
    GQLQuerySiteMetaDataArgs,
    GQLResolvers,
    GQLSiteMetaDataResolvers,
    GQLSiteMetaDataUpdateSiteMetaDataArgs,
} from "../__generated__/resolvers-types";
import { Denied } from "../errors";
import { Can } from "../permissions";

export const SiteMetaDataResolvers: GQLResolvers & {
    SiteMetaData: Required<GQLSiteMetaDataResolvers>;
} = {
    SiteMetaData: {
        __isTypeOf: (parent) => parent instanceof SiteMetaDataModel,
        key: (parent) => parent.key,
        value: (parent) => parent.value,
        createdAt: (parent) => parent.createdAt,
        updatedAt: (parent) => parent.updatedAt,
        async updateSiteMetaData(
            parent: SiteMetaData,
            { value }: GQLSiteMetaDataUpdateSiteMetaDataArgs,
            context: RequestContext
        ) {
            if (!(await Can.updateSiteMetaData(parent.key, context))) {
                throw new Denied();
            }
            return await context.batched.SiteMetaData.update(parent, { value });
        },
        async deleteSiteMetaData(parent: SiteMetaData, args: {}, context: RequestContext) {
            if (!(await Can.deleteSiteMetaData(parent.key, context))) {
                throw new Denied();
            }
            return await context.batched.SiteMetaData.delete({ key: parent.key });
        },
    },
    Query: {
        async getSiteMetaDataByKey(
            parent: {},
            { key }: GQLQueryGetSiteMetaDataByKeyArgs,
            context: RequestContext
        ): Promise<SiteMetaData> {
            if (!(await Can.viewSiteMetaData(key, context))) {
                throw new Denied();
            }
            return context.batched.SiteMetaData.get({ key });
        },
        async siteMetaData(
            parent: {},
            { keys }: GQLQuerySiteMetaDataArgs,
            context: RequestContext,
            info
        ): Promise<SiteMetaData[]> {
            return await Promise.all(
                keys.map(async (key) =>
                    SiteMetaDataResolvers.Query!.getSiteMetaDataByKey!(parent, { key }, context, info)
                )
            );
        },
    },
    Mutation: {
        async createSiteMetaData(
            parent: {},
            { key, value }: GQLMutationCreateSiteMetaDataArgs,
            context: RequestContext
        ): Promise<SiteMetaData> {
            if (!(await Can.createSiteMetaData(context))) {
                throw new Denied();
            }
            return await context.batched.SiteMetaData.create({ key, value });
        },
    },
};
