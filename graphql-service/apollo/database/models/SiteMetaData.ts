import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { SiteMetaDataKey } from "../../__generated__/resolvers-types";
import { GQLPartial, tableConfigs } from "../utils";

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
    key: SiteMetaDataKey;
    value: unknown;
    createdAt: number;
    updatedAt: number;
}

export type SiteMetaDataCreateProps = {
    key: SiteMetaDataKey;
    value: unknown;
} & GQLPartial<SiteMetaData>;

export const SiteMetaDataModel = dynamoose.model<SiteMetaData>("SiteMetaData", SiteMetaDataTableSchema, {
    ...tableConfigs,
});
