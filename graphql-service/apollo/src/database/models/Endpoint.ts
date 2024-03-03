import { HttpMethod } from "@/src/__generated__/gql/graphql";
import { tableConfigs } from "@/src/database/dynamodb";
import { DateTime, PK, String_Required_NotEmpty } from "@/src/database/utils";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import * as uuid from "uuid";

export const EndpointTableSchema = new dynamoose.Schema(
  {
    app: { hashKey: true, ...String_Required_NotEmpty("app") },
    rangeKey: { type: String, rangeKey: true, default: uuid.v4 },
    method: {
      type: String,
      default: HttpMethod.Get,
      enum: Object.values(HttpMethod),
    },
    path: { ...String_Required_NotEmpty("path") },
    destination: { ...String_Required_NotEmpty("destination") },
    description: { type: String, default: "" },
    deleted: { type: Boolean, default: false },
    deletedAt: { ...DateTime, required: false },
  },
  {
    timestamps: {
      createdAt: {
        createdAt: DateTime,
      },
      updatedAt: {
        updatedAt: DateTime,
      },
    },
  }
);
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.

export class Endpoint extends Item {
  app: PK;
  rangeKey: string;
  path: string;
  method: HttpMethod;
  destination: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedAt: Date | null;
}

export type EndpointCreateProps = {
  app: PK;
  path: string;
  destination: string;
} & Partial<Endpoint>;

export const EndpointModel = dynamoose.model<Endpoint>("Endpoint", EndpointTableSchema, { ...tableConfigs });
