import { SiteMetaDataKey } from "@/__generated__/resolvers-types";
import { RequestContext } from "../RequestContext";

export const SiteMetaDataPermissions = {
    async viewSiteMetaData(context: RequestContext, key: SiteMetaDataKey): Promise<boolean> {
        return Promise.resolve(true);
    },
    async updateSiteMetaData(context: RequestContext, key: SiteMetaDataKey): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },
    async deleteSiteMetaData(context: RequestContext, key: SiteMetaDataKey): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },
    async createSiteMetaData(context: RequestContext): Promise<boolean> {
        return Promise.resolve(context.isAdminUser || false);
    },
};
