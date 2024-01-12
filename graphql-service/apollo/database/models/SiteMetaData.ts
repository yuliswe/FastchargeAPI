import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { SiteMetaDataKey } from "../../__generated__/resolvers-types";
import { tableConfigs } from "../dynamodb";

export const SiteMetaDataTableSchema = new dynamoose.Schema(
  {
    key: { hashKey: true, type: String, required: true },
    value: { type: [String, Boolean, Number], required: true },
  },
  {
    timestamps: true,
  }
);

export class SiteMetaData extends Item {
  key: SiteMetaDataKey | string;
  value: unknown;
  createdAt: number;
  updatedAt: number;
}

export type SiteMetaDataCreateProps = {
  key: SiteMetaDataKey | string;
  value: unknown;
} & Partial<SiteMetaData>;

export const SiteMetaDataModel = dynamoose.model<SiteMetaData>("SiteMetaData", SiteMetaDataTableSchema, {
  ...tableConfigs,
});

export const defaultSiteMetaDataValue: { [k in SiteMetaDataKey]: string | number } = {
  [SiteMetaDataKey.StripeFlatFee]: "0.3",
  [SiteMetaDataKey.StripePercentageFee]: "0.029",
  [SiteMetaDataKey.PerRequestCharge]: "0.001",
};
