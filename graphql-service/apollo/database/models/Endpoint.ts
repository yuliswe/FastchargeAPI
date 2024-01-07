import { HttpMethod } from "@/__generated__/gql/graphql";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { tableConfigs } from "../dynamodb";
import { PK, String_Required_NotEmpty, defaultCreatedAt } from "../utils";

export const EndpointTableSchema = new dynamoose.Schema(
  {
    app: { hashKey: true, ...String_Required_NotEmpty("app") },
    createdAt: {
      type: Number,
      rangeKey: true,
      default: defaultCreatedAt,
    },
    method: {
      type: String,
      default: HttpMethod.Get,
      enum: Object.values(HttpMethod),
    },
    path: { ...String_Required_NotEmpty("path") },
    destination: { ...String_Required_NotEmpty("destination") },
    description: { type: String, default: "" },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Number, required: false },
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

export class Endpoint extends Item {
  app: PK;
  path: string;
  method: HttpMethod;
  destination: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  deletedAt: number | null;
}

export type EndpointCreateProps = {
  app: PK;
  path: string;
  destination: string;
} & Partial<Endpoint>;

export const EndpointModel = dynamoose.model<Endpoint>("Endpoint", EndpointTableSchema, { ...tableConfigs });
