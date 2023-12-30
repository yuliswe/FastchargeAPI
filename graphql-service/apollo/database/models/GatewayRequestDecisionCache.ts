import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { PK, tableConfigs } from "../utils";

export const GatewayRequestDecisionCacheTableSchema = new dynamoose.Schema(
  {
    requester: { hashKey: true, type: String, required: true },
    app: { rangeKey: true, type: String, required: true },
    pricing: { type: String, required: true },
    nextForcedBalanceCheckRequestCount: { type: Number, required: true },
    nextForcedBalanceCheckTime: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export class GatewayRequestDecisionCache extends Item {
  requester: PK;
  app: PK | null;
  pricing: PK;
  nextForcedBalanceCheckRequestCount: number;
  nextForcedBalanceCheckTime: number;
}

export type GatewayRequestDecisionCacheCreateProps = {
  requester: PK;
  app: PK;
  pricing: PK;
  nextForcedBalanceCheckRequestCount: number;
  nextForcedBalanceCheckTime: number;
} & Partial<GatewayRequestDecisionCache>;

export const GatewayRequestDecisionCacheModel = dynamoose.model<GatewayRequestDecisionCache>(
  "GatewayRequestDecisionCache",
  GatewayRequestDecisionCacheTableSchema,
  { ...tableConfigs }
);