import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { PK, String_Required_NotEmpty, tableConfigs } from "../utils";

export const SubscriptionTableSchema = new dynamoose.Schema(
    {
        subscriber: {
            hashKey: true,
            ...String_Required_NotEmpty("subscriber"),
        },
        app: { rangeKey: true, ...String_Required_NotEmpty("app") },
        pricing: {
            ...String_Required_NotEmpty("pricing"),
            index: {
                type: "global",
                name: "indexByPricing_subscriber__onlyPK",
                project: ["pricing", "subscriber"],
            },
        },
    },
    { timestamps: true }
);
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.

/**
 * Represends a user's subscription to an app.
 * @deletable true
 */
export class Subscription extends Item {
    subscriber: PK;
    app: PK;
    pricing: PK;
    createdAt: number;
    updatedAt: number;
}

export type SubscriptionCreateProps = {
    subscriber: PK;
    app: PK;
    pricing: PK;
} & Partial<Subscription>;

export const SubscriptionModel = dynamoose.model<Subscription>("Subscription", SubscriptionTableSchema, {
    ...tableConfigs,
});
