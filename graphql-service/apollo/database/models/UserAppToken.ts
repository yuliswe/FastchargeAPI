import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { PK, defaultCreatedAt, tableConfigs } from "../utils";

export const UserAppTokenTableSchema = new dynamoose.Schema(
  {
    subscriber: { hashKey: true, type: String, required: true },
    createdAt: {
      type: Number,
      rangeKey: true,
      default: defaultCreatedAt,
    },
    app: { type: String, required: true },
    signature: { type: String, required: true },
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

export class UserAppToken extends Item {
  subscriber: PK;
  app: PK;
  signature: string;
  createdAt: number;
  updatedAt: number;
  token: string | null;
}

export type UserAppTokenCreateProps = {
  subscriber: PK;
  app: PK;
  signature: string;
} & Partial<UserAppToken>;

export const UserAppTokenModel = dynamoose.model<UserAppToken>("UserAppToken", UserAppTokenTableSchema, {
  ...tableConfigs,
});
