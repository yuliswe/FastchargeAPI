import { tableConfigs } from "@/src/database/dynamodb";
import { String_Required_NotEmpty } from "@/src/database/utils";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

export const SecretTableSchema = new dynamoose.Schema(
  {
    key: {
      hashKey: true,
      ...String_Required_NotEmpty("key"),
    },
    value: { type: String, required: true },
    expireAt: { type: Number, required: false },
    description: { type: String, required: false }, // for debugging
  },
  {
    timestamps: true,
  }
);

export class Secret extends Item {
  key: string;
  value: string;
  description: string;
  expireAt: number;
  createdAt: number;
}

export type SecretCreateProps = {
  key: string;
  value: string;
} & Partial<Secret>;

export const SecretModel = dynamoose.model<Secret>("Secret", SecretTableSchema, { ...tableConfigs });
