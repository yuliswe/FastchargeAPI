import { RequestContext } from "../RequestContext";

export const SiteMetaDataPermissions = {
  async viewSiteMetaData(key: string, context: RequestContext): Promise<boolean> {
    return Promise.resolve(true);
  },
  async updateSiteMetaData(key: string, context: RequestContext): Promise<boolean> {
    return Promise.resolve(context.isAdminUser || false);
  },
  async deleteSiteMetaData(key: string, context: RequestContext): Promise<boolean> {
    return Promise.resolve(context.isAdminUser || false);
  },
  async createSiteMetaData(context: RequestContext): Promise<boolean> {
    return Promise.resolve(context.isAdminUser || false);
  },
};
