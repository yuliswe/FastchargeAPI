import { Currency } from "@/__generated__/gql/graphql";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { StripeTransferStatus } from "../../__generated__/resolvers-types";
import { PK, String_Required_NotEmpty, defaultCreatedAt, tableConfigs, validateStringDecimal } from "../utils";

export enum StripeTransferTableIndex {
    StatusTransferAt = "indexByStatus_transferAt__onlyPK",
}

export const StripeTransferTableSchema = new dynamoose.Schema(
    {
        receiver: {
            hashKey: true,
            ...String_Required_NotEmpty("receiver"),
        },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
        receiveAmount: {
            type: String,
            required: true,
            validate: validateStringDecimal("receiveAmount"),
        },
        withdrawAmount: {
            type: String,
            required: true,
            validate: validateStringDecimal("withdrawAmount"),
        },
        currency: { type: String, required: false, default: Currency.Usd },
        stripeTransferId: { type: String, required: false },
        stripeTransferObject: { type: Object, required: false },
        accountActivity: { type: String, required: false },
        feeActivity: { type: String, required: false },
        transferAt: { type: Number, required: true },
        status: {
            type: String,
            index: {
                name: StripeTransferTableIndex.StatusTransferAt,
                rangeKey: "transferAt",
                type: "global",
                project: ["transferAt", "status"],
            },
            enum: Object.values(StripeTransferStatus),
            required: true,
        },
    },
    {
        timestamps: {
            updatedAt: {
                type: Number,
            },
        },
    }
);
/**
 * StripeTransfer represents an event when the user withdraw money to their
 * Stripe account.
 *
 * @accountActivity The ID of the AccountActivity item which represents the
 * amount the user will receive.
 *
 * @feeActivity The ID of the AccountActivity item which represents the fee that
 * the user pays us.
 *
 * @transferAt The time when the transfer is actually moved out of our account.
 * The time can be in the future or in the past. If the time is in the future,
 * then at some point the money will be transferred in the future, by a cron
 * job.
 */

export class StripeTransfer extends Item {
    receiver: PK;
    withdrawAmount: string;
    receiveAmount: string;
    currency: Currency;
    stripeTransferObject: object | null;
    stripeTransferId: string | null;
    createdAt: number;
    accountActivity: PK;
    feeActivity: PK;
    transferAt: number;
    status: StripeTransferStatus;
}

export type StripeTransferCreateProps = {
    receiver: PK;
    receiveAmount: string;
    withdrawAmount: string;
    transferAt: number;
    status: StripeTransferStatus;
} & Partial<StripeTransfer>;

export const StripeTransferModel = dynamoose.model<StripeTransfer>("StripeTransfer", StripeTransferTableSchema, {
    ...tableConfigs,
});
