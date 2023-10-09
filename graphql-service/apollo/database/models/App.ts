import { AppVisibility } from "@/__generated__/gql/graphql";
import { GatewayMode } from "@/__generated__/resolvers-types";
import { validateAppName } from "@/functions/app";
import dynamoose from "dynamoose";
import { Item, tableConfigs } from "../utils";

export { AppVisibility, GatewayMode };

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
                name: "indexByOwner__onlyPK",
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
        deletedAt: { type: Number, required: false },
    },
    { timestamps: true }
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
    updatedAt: number;
    createdAt: number;
    visibility: AppVisibility;
    logo: string;
    deleted: boolean;
    deletedAt: number | null;
}

export type AppCreateProps = {
    name: string;
    owner: string;
} & Partial<App>;

export const AppModel = dynamoose.model<App>("App", AppTableSchema, {
    ...tableConfigs,
});
