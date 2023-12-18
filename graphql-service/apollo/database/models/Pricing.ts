import { PricingAvailability } from "@/__generated__/gql/graphql";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { PK, String_Required_NotEmpty, defaultCreatedAt, tableConfigs } from "../utils";

export { PricingAvailability };

export const PricingTableSchema = new dynamoose.Schema(
  {
    app: { hashKey: true, ...String_Required_NotEmpty("app") },
    createdAt: {
      rangeKey: true,
      type: Number,
      default: defaultCreatedAt,
    },
    name: { ...String_Required_NotEmpty("name") },
    callToAction: { type: String, default: "" },
    minMonthlyCharge: { type: String, default: "0" },
    chargePerRequest: { type: String, default: "0" },
    freeQuota: { type: Number, default: 0 },
    minMonthlyChargeFloat: Number,
    chargePerRequestFloat: Number,
    availability: {
      type: String,
      default: PricingAvailability.Public,
      enum: Object.values(PricingAvailability),
    },
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
 * Represents a pricing plan for an app.
 * @deletable false
 */
export class Pricing extends Item {
  app: PK;
  createdAt: number;
  name: string;
  callToAction: string;
  minMonthlyCharge: string;
  chargePerRequest: string;
  freeQuota: number;
  minMonthlyChargeFloat: number;
  chargePerRequestFloat: number;
  availability: PricingAvailability;
  updatedAt: number;
}

export type PricingCreateProps = {
  app: PK;
  name: string;
} & Partial<Pricing>;

export const PricingModel = dynamoose.model<Pricing>("Pricing", PricingTableSchema, { ...tableConfigs });
