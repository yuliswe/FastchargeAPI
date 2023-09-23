import { SiteMetaDataKey } from "@/__generated__/resolvers-types";
import { RequestContext } from "../RequestContext";

export const SiteMetaDataPermissions = {
    async viewSiteMetaData(key: SiteMetaDataKey, context: RequestContext): Promise<boolean> {
        return Promise.resolve(true);
    },
    async updateSiteMetaData(key: SiteMetaDataKey, context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },
    async deleteSiteMetaData(key: SiteMetaDataKey, context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },
    async createSiteMetaData(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },
};
