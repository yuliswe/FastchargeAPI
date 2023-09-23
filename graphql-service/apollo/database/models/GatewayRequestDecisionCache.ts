import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { GQLPartial, PK, tableConfigs } from "../utils";

export const GatewayRequestDecisionCacheTableSchema = new dynamoose.Schema(
    {
        requester: { hashKey: true, type: String, required: true },
        app: { rangeKey: true, type: String, required: true },
        pricing: { type: String, required: false },
        useGlobalCounter: { type: Boolean, default: false },
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
    pricing: PK | null;
    useGlobalCounter: boolean;
    nextForcedBalanceCheckRequestCount: number;
    nextForcedBalanceCheckTime: number;
}

export type GatewayRequestDecisionCacheCreateProps = {
    requester: PK;
    app: PK;
    nextForcedBalanceCheckRequestCount: number;
    nextForcedBalanceCheckTime: number;
} & GQLPartial<GatewayRequestDecisionCache>;

export const GatewayRequestDecisionCacheModel = dynamoose.model<GatewayRequestDecisionCache>(
    "GatewayRequestDecisionCache",
    GatewayRequestDecisionCacheTableSchema,
    { ...tableConfigs }
);
