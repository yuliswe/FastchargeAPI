import { TableClass } from "dynamoose/dist/Table/types";

export const tableConfigs = {
  create: false,
  update: false, // do not set this to true. It will whipe the GSI.
  initialize: true,
  throughput: "ON_DEMAND" as const,
  prefix: process.env.DEV_DOMAIN === "1" ? "dev_2023_mar_1_" : "live_",
  suffix: "",
  waitForActive: {
    enabled: false,
    check: {
      timeout: 128000,
      frequency: 1000,
    },
  },
  expires: undefined,
  tags: {},
  tableClass: TableClass.standard,
};
