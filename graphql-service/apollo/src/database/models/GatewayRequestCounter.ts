import { tableConfigs } from "@/src/database/dynamodb";
import { PK } from "@/src/database/utils";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

export const GatewayRequestCounterTableSchema = new dynamoose.Schema(
  {
    requester: { hashKey: true, type: String, required: true },
    app: { rangeKey: true, type: String, required: true },
    isGlobalCounter: { type: Boolean, default: false },
    counter: { type: Number, default: 0 },
    counterSinceLastReset: { type: Number, default: 0 },
    lastResetTime: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.

export class GatewayRequestCounter extends Item {
  requester: PK;
  app: PK | null | "<global>";
  counter: number;
  counterSinceLastReset: number;
  lastResetTime: number;
  isGlobalCounter: boolean;
}

export type GatewayRequestCounterCreateProps = {
  requester: PK;
  app: PK;
} & Partial<GatewayRequestCounter>;

export const GatewayRequestCounterModel = dynamoose.model<GatewayRequestCounter>(
  "GatewayRequestCounter",
  GatewayRequestCounterTableSchema,
  { ...tableConfigs }
);
