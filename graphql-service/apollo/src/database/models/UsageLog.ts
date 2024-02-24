import { UsageLogStatus } from "@/src/__generated__/resolvers-types";
import { tableConfigs } from "@/src/database/dynamodb";
import { PK, String_Required_NotEmpty, defaultCreatedAt } from "@/src/database/utils";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

export const UsageLogTableSchema = new dynamoose.Schema(
  {
    subscriber: {
      hashKey: true,
      ...String_Required_NotEmpty("subscriber"),
    },
    createdAt: {
      type: Number,
      rangeKey: true,
      default: defaultCreatedAt,
    },
    app: { ...String_Required_NotEmpty("app") },
    status: {
      type: String,
      enum: Object.values(UsageLogStatus),
      default: UsageLogStatus.Pending,
    },
    collectedAt: { type: Number, required: false },
    path: String_Required_NotEmpty("path"),
    volume: { type: Number, default: 1 },
    usageSummary: { type: String, required: false, default: undefined },
    pricing: { type: String, required: true },
  },
  {
    timestamps: {
      updatedAt: {
        updatedAt: {
          type: Number,
        },
      },
    },
  }
);
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
/**
 * Represents a single API request access log. This is used to calculate the
 * billing. When user makes a request, a UsageLog item is created in a queue.
 * The server periodically collects the queue and creates UsageSummary items.
 */

export class UsageLog extends Item {
  subscriber: PK; // User who made the API request
  app: PK;
  path: string;
  createdAt: number;
  volume: number; // Number of requests. This is always 1 for now. Set to 2 for double rate charging.
  status: UsageLogStatus;
  collectedAt: number; // When the UsageSummary was created
  usageSummary: PK | null; // ID of the UsageSummary item or null if not yet collected
  pricing: PK;
}

export type UsageLogCreateProps = {
  subscriber: PK;
  app: PK;
  path: string;
  pricing: PK;
} & Partial<UsageLog>;

export const UsageLogModel = dynamoose.model<UsageLog>("UsageLog", UsageLogTableSchema, { ...tableConfigs });
