import { AppVisibility } from "@/src/__generated__/gql/graphql";
import { GatewayMode } from "@/src/__generated__/resolvers-types";
import { tableConfigs } from "@/src/database/dynamodb";
import { DateTime, Item, timestamps } from "@/src/database/utils";
import { validateAppName } from "@/src/functions/app";
import dynamoose from "dynamoose";

export { AppVisibility, GatewayMode };
export enum AppTableIndex {
  Owner = "indexByOwner__onlyPK",
}

export const AppTableSchema = new dynamoose.Schema(
  {
    name: {
      hashKey: true,
      type: String,
      required: true,
      validate: validateAppName,
    },
    owner: {
      type: String,
      required: true,
      index: {
        type: "global",
        name: AppTableIndex.Owner,
        project: ["name", "owner"],
      },
    },
    logo: { type: String },
    title: { type: String },
    gatewayMode: { type: String, default: "proxy", enum: ["proxy", "redirect"] },
    description: { type: String },
    repository: { type: String },
    homepage: { type: String },
    readme: { type: String },
    visibility: { type: String, default: "private", enum: ["public", "private"] },

    deleted: { type: Boolean, default: false },
    deletedAt: { ...DateTime, required: false },
  },
  { timestamps }
);
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class App extends Item {
  name: string;
  owner: string;
  title: string;
  description: string;
  gatewayMode: GatewayMode;
  repository: string;
  homepage: string;
  readme: string;
  updatedAt: Date;
  createdAt: Date;
  visibility: AppVisibility;
  logo: string;
  deleted: boolean;
  deletedAt: Date | null;
}

export type AppCreateProps = {
  name: string;
  owner: string;
} & Partial<App>;

export const AppModel = dynamoose.model<App>("App", AppTableSchema, {
  ...tableConfigs,
});