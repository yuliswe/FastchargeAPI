import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { GQLPartial, PK, String_Required_NotEmpty, tableConfigs, validateStringDecimal } from "../utils";

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.

export class AccountHistory extends Item {
    user: PK;
    startingBalance: string;
    closingBalance: string;
    startingTime: number;
    closingTime: number;
    sequentialId: number;
}

export type AccountHistoryCreateProps = {
    user: PK;
    startingTime: number;
    startingBalance: string;
    closingBalance: string;
    closingTime: number;
    sequentialId: number;
} & GQLPartial<AccountHistory>;

export const AccountHistoryTableSchema = new dynamoose.Schema(
    {
        user: { hashKey: true, ...String_Required_NotEmpty("user") },
        startingTime: { type: Number, rangeKey: true, required: true },
        startingBalance: {
            type: String,
            required: true,
            validate: validateStringDecimal("startingBalance"),
        },
        closingBalance: {
            type: String,
            required: true,
            validate: validateStringDecimal("closingBalance"),
        },
        closingTime: { required: true, type: Number },
        sequentialId: { required: true, type: Number },
    },
    {
        timestamps: true,
    }
);
export const AccountHistoryModel = dynamoose.model<AccountHistory>("AccountHistory", AccountHistoryTableSchema, {
    ...tableConfigs,
});
