import { RequestContext } from "@/RequestContext";
import { SiteMetaDataKey } from "@/__generated__/resolvers-types";
import { SiteMetaDataModel, defaultSiteMetaDataValue } from "@/database/models/SiteMetaData";
import { NotFound } from "@/errors";

export async function getSiteMetaDataOrDefault(context: RequestContext, key: SiteMetaDataKey) {
  const data = await context.batched.SiteMetaData.getOrNull({ key });
  if (data) {
    return data;
  }
  const value = defaultSiteMetaDataValue[key];
  if (value === undefined) {
    throw new NotFound("SiteMetaData", { key });
  }
  return new SiteMetaDataModel({ key, value, createdAt: Date.now(), updatedAt: Date.now() });
}
