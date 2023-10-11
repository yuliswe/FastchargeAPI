import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { AccountActivityReason, AccountActivityStatus, AccountActivityType } from "../../__generated__/resolvers-types";
import { NULL, PK, String_Required_NotEmpty, defaultCreatedAt, tableConfigs, validateStringDecimal } from "../utils";

export enum AccountActivityTableIndex {
    StatusSettleAt = "indexByStatus_settleAt__onlyPK",
}

export const AccountActivityTableSchema = new dynamoose.Schema(
    {
        user: { hashKey: true, ...String_Required_NotEmpty("user") },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
        type: {
            type: String,
            required: true,
            enum: Object.values(AccountActivityType),
        },
        reason: {
            type: String,
            required: true,
            enum: Object.values(AccountActivityReason),
        },
        status: {
            type: String,
            index: {
                name: AccountActivityTableIndex.StatusSettleAt,
                rangeKey: "settleAt",
                type: "global",
                project: ["settleAt", "status"],
            },
            enum: Object.values(AccountActivityStatus),
            required: true,
            default: AccountActivityStatus.Pending,
        },
        settleAt: { type: Number, required: true },
        amount: {
            type: String,
            required: true,
            validate: validateStringDecimal("amount"),
        },
        usageSummary: { type: [String, NULL], required: false },
        stripeTransfer: { type: [String, NULL], required: false },
        stripePaymentAccept: { type: [String, NULL], required: false },
        description: { type: String, default: "" },
        billedApp: { type: [String, NULL], required: false },
        consumedFreeQuota: { type: [Number, NULL], required: false },
    },
    {
        timestamps: {
            updatedAt: { updatedAt: { type: Number } },
        },
    }
);
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
/**
 * Records a single account activity.
 *
 * @settleAt We use the word "settle" to mean the activity is reflected in the
 * user's balance. The time can be in the past or in the future. If the time is
 * in the future, for example, when depositing to the user's balance, we might
 * want to hold the money for a period of time, then at somepoint the
 * AccountActivity should be settled in the future, just not now.
 */

export class AccountActivity extends Item {
    user: PK; // User who's account is affected
    type: AccountActivityType;
    reason: AccountActivityReason;
    status: AccountActivityStatus;
    settleAt: number; // Unix timestamp when the activity is settled. Can be in the future.
    amount: string;
    usageSummary: PK | null; // ID of the UsageSummary item or null if not related to usage
    accountHistory: PK | null; // ID of the AccountHistory item or null if not related to account history
    createdAt: number;
    description: string;
    stripeTransfer: PK | null; // ID of the StripeTransfer item or null if not related to Stripe
    stripePaymentAccept: PK | null; // ID of the StripePaymentAccept item or null if not related to Stripe
    billedApp: PK | null; // ID of the App item if the activity is related to billing an app. This is the same as usageSummary.app
    consumedFreeQuota: number | null; // Number of free quota consumed by the subscriber when the activity is related to API usage. Usually this is the same as usageSummary.volume
}

export type AccountActivityCreateProps = {
    user: PK;
    type: AccountActivityType;
    reason: AccountActivityReason;
    amount: string;
    settleAt: number;
} & Partial<AccountActivity>;

export const AccountActivityModel = dynamoose.model<AccountActivity>("AccountActivity", AccountActivityTableSchema, {
    ...tableConfigs,
});
