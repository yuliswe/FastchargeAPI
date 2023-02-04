import dynamoose, { Table } from "dynamoose";
import { TableClass } from "dynamoose/dist/Table/types";
import { AppModel, EndpointModel, UserModel } from "./models";

const MAKE_TABLE = false;

export const tableConfigs = {
    create: MAKE_TABLE,
    update: MAKE_TABLE,
    initialize: true,
    throughput: "ON_DEMAND" as const,
    prefix: "dev__",
    suffix: "",
    waitForActive: {
        enabled: MAKE_TABLE,
        check: {
            timeout: 128_000,
            frequency: 1000,
        },
    },
    expires: null,
    tags: {},
    tableClass: TableClass.standard,
};

export async function resetTables() {
    let appList = await AppModel.scan().exec();
    await AppModel.batchDelete(appList.map((x) => x.name));

    let userList = await UserModel.scan().exec();
    await UserModel.batchDelete(userList.map((x) => x.email));

    return true;
}
