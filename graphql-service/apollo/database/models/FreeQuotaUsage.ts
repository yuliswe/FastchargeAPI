import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { GQLPartial, PK, tableConfigs } from "../utils";

export const FreeQuotaUsageTableSchema = new dynamoose.Schema(
    {
        subscriber: { hashKey: true, type: String, required: true },
        app: { rangeKey: true, type: String, required: true },
        usage: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

export class FreeQuotaUsage extends Item {
    subscriber: PK;
    app: PK;
    usage: number;
}

export type FreeQuotaUsageCreateProps = {
    subscriber: PK;
    app: PK;
} & GQLPartial<FreeQuotaUsage>;
export const FreeQuotaUsageModel = dynamoose.model<FreeQuotaUsage>("FreeQuotaUsage", FreeQuotaUsageTableSchema, {
    ...tableConfigs,
});
