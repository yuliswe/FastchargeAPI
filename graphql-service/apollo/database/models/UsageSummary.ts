import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { UsageSummaryStatus } from "../../__generated__/resolvers-types";
import { GQLPartial, PK, String_Required_NotEmpty, defaultCreatedAt, tableConfigs } from "../utils";

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
/**
 * Represents a summary of API request access logs. This is used to calculate
 * the billing. Each UsageSummary item represents a single billing period and
 * can be billed to create AccountActivity item.
 */

export class UsageSummary extends Item {
    app: PK;
    subscriber: PK;
    volume: number;
    createdAt: number;
    status: UsageSummaryStatus; // billed when account activities have been created
    billedAt: number | null;
    numberOfLogs: number; // Number of usage logs in the queue when collected
    billingRequestChargeAccountActivity: PK | null; // ID of the AccountActivity item or null if not yet billed
    billingMonthlyChargeAccountActivity: PK | null; // ID of the AccountActivity item or null if not yet billed
    appOwnerServiceFeeAccountActivity: PK | null; // ID of the AccountActivity item or null if not yet billed
    appOwnerRequestChargeAccountActivity: PK | null; // ID of the AccountActivity item or null if not yet billed
    appOwnerMonthlyChargeAccountActivity: PK | null; // ID of the AccountActivity item or null if not yet billed
    pricing: PK;
}

export type UsageSummaryCreateProps = {
    subscriber: PK;
    app: PK;
    pricing: PK;
    path: string;
    numberOfLogs: number;
} & GQLPartial<UsageSummary>;

export const UsageSummaryTableSchema = new dynamoose.Schema(
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
        app: {
            ...String_Required_NotEmpty("app"),
        },
        volume: { type: Number, default: 1 },
        status: {
            type: String,
            enum: Object.values(UsageSummaryStatus),
            default: UsageSummaryStatus.Pending,
        },
        billedAt: { type: Number, default: undefined },
        numberOfLogs: { type: Number, required: true },
        billingRequestChargeAccountActivity: { type: String, default: undefined },
        billingMonthlyChargeAccountActivity: { type: String, default: undefined },
        appOwnerServiceFeeAccountActivity: { type: String, default: undefined },
        appOwnerRequestChargeAccountActivity: { type: String, default: undefined },
        appOwnerMonthlyChargeAccountActivity: { type: String, default: undefined },
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
export const UsageSummaryModel = dynamoose.model<UsageSummary>("UsageSummary", UsageSummaryTableSchema, {
    ...tableConfigs,
});
