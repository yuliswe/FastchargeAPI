import { RequestContext } from "@/src/RequestContext";
import { SiteMetaDataKey } from "@/src/__generated__/resolvers-types";
import { SiteMetaDataModel, defaultSiteMetaDataValue } from "@/src/database/models/SiteMetaData";
import { NotFound } from "@/src/errors";

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
