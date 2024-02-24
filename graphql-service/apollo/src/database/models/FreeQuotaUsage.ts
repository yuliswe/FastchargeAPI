import { tableConfigs } from "@/src/database/dynamodb";
import { PK } from "@/src/database/utils";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

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
} & Partial<FreeQuotaUsage>;

export const FreeQuotaUsageModel = dynamoose.model<FreeQuotaUsage>("FreeQuotaUsage", FreeQuotaUsageTableSchema, {
  ...tableConfigs,
});
