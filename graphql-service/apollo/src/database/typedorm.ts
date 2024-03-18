import { Entity, INDEX_TYPE, Table } from "@typedorm/common";
import { inspect } from "util";

const tablePrefix = process.env.DEV_DOMAIN === "1" ? "dev_2023_mar_1_" : "live_";

export function getTableName(tableName: string) {
  return `${tablePrefix}${tableName}`;
}

type Constructor = {
  new (...args: any[]): {};
};

type EntityWithTableOptions = {
  name: string;
  partitionKey: string;
  sortKey?: string;
  indexes?: Record<string, { type: string; partitionKey: string; sortKey: string }>;
};

function mapRecord<R, T>(record: Record<string, T>, fn: (v: T) => R): Record<string, R> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, fn(v)]));
}

export function EntityWithTable(args: EntityWithTableOptions): <E extends Constructor>(target: E) => E {
  const { name, partitionKey, sortKey, indexes } = args;
  const config = {
    name,
    table: new Table({
      name: getTableName(name),
      partitionKey,
      ...(sortKey && { sortKey }),
      ...(indexes && {
        indexes: mapRecord(indexes, (v) => ({
          partitionKey: v.partitionKey,
          sortKey: v.sortKey,
          type: INDEX_TYPE.GSI,
        })),
      }),
    }),
    primaryKey: {
      partitionKey: { alias: partitionKey },
      ...(sortKey && { sortKey: { alias: sortKey } }),
    },
    indexes: indexes
      ? mapRecord(indexes, (v) => ({
          partitionKey: { alias: v.partitionKey },
          ...(v.sortKey && { sortKey: { alias: v.sortKey } }),
          type: INDEX_TYPE.GSI,
        }))
      : undefined,
  };
  return Entity(config as never);
}
