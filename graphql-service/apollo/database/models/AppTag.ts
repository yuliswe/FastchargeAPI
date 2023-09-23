import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { GQLPartial, PK, String_Required_NotEmpty, tableConfigs } from "../utils";

export enum AppTagTableIndex {
    indexByTagAppOnlyPK = "indexByTag_app__onlyPK",
}
export const AppTagTableSchema = new dynamoose.Schema(
    {
        app: { hashKey: true, ...String_Required_NotEmpty("app") },
        tag: {
            rangeKey: true,
            ...String_Required_NotEmpty("tag"),
            index: {
                type: "global",
                name: AppTagTableIndex.indexByTagAppOnlyPK,
                project: ["tag", "app"],
            },
        },
    },
    { timestamps: true }
);
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.

export class AppTag extends Item {
    app: PK;
    /** Tag name as string */
    tag: string;
    updatedAt: number;
    createdAt: number;
}

export type AppTagCreateProps = {
    app: PK;
    tag: PK;
} & GQLPartial<AppTag>;
export const AppTagModel = dynamoose.model<AppTag>("AppTag", AppTagTableSchema, {
    ...tableConfigs,
});
