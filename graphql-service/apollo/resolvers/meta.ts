import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateSiteMetaDataArgs,
    GQLQuerySiteMetaDataArgs,
    GQLResolvers,
    GQLSiteMetaDataResolvers,
    GQLSiteMetaDataUpdateSiteMetaDataArgs,
} from "../__generated__/resolvers-types";
import { SiteMetaData, SiteMetaDataModel } from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";

export const siteMetaDataResolvers: GQLResolvers & {
    SiteMetaData: Required<GQLSiteMetaDataResolvers>;
} = {
    SiteMetaData: {
        __isTypeOf: (parent) => parent instanceof SiteMetaDataModel,
        key: (parent) => parent.key,
        value: (parent) => parent.value,
        async updateSiteMetaData(
            parent: SiteMetaData,
            { value }: GQLSiteMetaDataUpdateSiteMetaDataArgs,
            context: RequestContext
        ) {
            if (!(await Can.updateSiteMetaData(context, parent.key))) {
                throw new Denied();
            }
            return await context.batched.SiteMetaData.update(parent, { value });
        },
        async deleteSiteMetaData(parent: SiteMetaData, args: {}, context: RequestContext) {
            if (!(await Can.deleteSiteMetaData(context, parent.key))) {
                throw new Denied();
            }
            return await context.batched.SiteMetaData.delete({ key: parent.key });
        },
    },
    Query: {
        siteMetaData: async (
            parent: {},
            { keys }: GQLQuerySiteMetaDataArgs,
            context: RequestContext
        ): Promise<SiteMetaData[]> => {
            for (const key of keys) {
                if (!(await Can.viewSiteMetaData(context, key))) {
                    throw new Denied();
                }
            }
            const promises = [];
            for (const key of keys) {
                promises.push(context.batched.SiteMetaData.getOrNull({ key }));
            }
            const results = await Promise.all(promises);
            return results.filter((result) => result !== null) as SiteMetaData[];
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
