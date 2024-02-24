import { AlreadyExists, NotFound, UpdateContainsPrimaryKey } from "@/src/errors";
import { settlePromisesInBatches } from "@/src/functions/promise";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import DataLoader from "dataloader";
import { KeyObject, ModelType } from "dynamoose/dist/General";
import { Item } from "dynamoose/dist/Item";
import { Query as DynamogooseQuery, Scan as DynamogooseScan } from "dynamoose/dist/ItemRetriever";
import hash from "object-hash";

/**
 * This file is a collection of functions that are used to bridge Dynamoose with
 * DataLoader.
 */

type ConditionQuery<V> = {
  // where?: Optional<V>;
  // filter?: Optional<V>;
  // attribute?: Optional<V>;
  eq?: V;
  lt?: V;
  le?: V;
  gt?: V;
  ge?: V;
  beginsWith?: V;
  contains?: V;
  // exists?: () => Condition;
  in?: V[];
  between?: [V, V];
};

type Query<T> = {
  [K in keyof T & string]?: T[K] | ConditionQuery<T[K]>;
};

type UpdateQuery<T> = Partial<T> | AdvancedUpdateQuery<T>;
type AdvancedUpdateQuery<T> = {
  $SET?: Partial<T>;
  $REMOVE?: (keyof T)[];
  $ADD?: Partial<T>;
  $DELETE?: Partial<T>;
};

function applyBatchOptionsToQuery<T>(query: DynamogooseQuery<T>, options: BatchQueryOptions): DynamogooseQuery<T> {
  if (options) {
    if (options.limit != null) {
      query = query.limit(options.limit);
    }
    if (options.sort != null) {
      query = query.sort(options.sort);
    }
    if (options.using != null) {
      query = query.using(options.using);
    }
    if (options.consistent) {
      query = query.consistent();
    }
  }
  return query;
}

function applyBatchOptionsToScan<T>(query: DynamogooseScan<T>, options: BatchQueryOptions): DynamogooseScan<T> {
  if (options) {
    if (options.limit != null) {
      query = query.limit(options.limit);
    }
    if (options.using != null) {
      query = query.using(options.using);
    }
    if (options.consistent) {
      query = query.consistent();
    }
  }
  return query;
}

/**
 * Extracts primary key from item, and if present, the range key too.
 * @param model
 * @param item
 * @returns An object { [hashKeyName]: hashKey, [rangeKeyName]?: rangeKey }
 */
function extractKeysFromItems<I extends Item, Input extends Partial<I>>(
  model: ModelType<I>,
  item: Input
): Partial<Input> {
  const hashKeyName = model.table().hashKey as keyof Input;
  const rangeKeyName = model.table().rangeKey as keyof Input;
  const query = {
    [hashKeyName]: item[hashKeyName],
  } as Partial<Input>;
  if (rangeKeyName != undefined && item[rangeKeyName] != null) {
    query[rangeKeyName] = item[rangeKeyName]!;
  }
  return query;
}

/**
 * Adds default values to the item, if the value is undefined. Unlike
 * Item.withDefaults(), this function returns the original Item type instead of
 * a plain object.
 */
async function assignDefaults<I extends Item>(item: I): Promise<I> {
  // TODO: There is a bug with item.withDefaults(), in that in converts a Date
  // type to a string. This may cause issues when the item is saved back to
  // the DB, failing the validation because the DB expects a Date type.
  const defaults = (await item.withDefaults()) as I;
  for (const key of Object.keys(defaults)) {
    // This is a temporary fix, but if the item's date field is undefined
    // (maybe an old object before a schema added a new date field), then
    // the problem still exists. The workaround is to not ever use the Date
    // type on the DB schema, and instead use a Number type.
    if (item[key] == undefined) {
      item[key] = defaults[key];
    }
  }
  return item;
}

type Cursor = { lastKey: KeyObject };
type BatchQueryOptions = {
  limit?: number | null;
  sort?: "ascending" | "descending" | null;
  using?: string | null; // Index name
  consistent?: boolean; // Use consistent read
  batchSize?: number; // Number of items to get per batch
  cursor?: Cursor;
};
type BatchKey<I extends Item> = {
  query: Query<I>;
  options?: BatchQueryOptions;
};
type BatchScanOptions = {
  limit?: number | null;
  using?: string | null; // Index name
  consistent?: boolean; // Use consistent read
  batchSize?: number; // Number of items to get per batch
};
type DataLoaderResult<I> = { items: I[]; cursor?: Cursor; total: number };

/**
 * Used by DataLoader, this function takes a list of primary keys and returns a
 * list of items of the same count.
 *
 * The batch key can be a BasePK. a hash key, or a hash key + range key.
 * Model.getBatch() uses BatchGetItem, which requires that for each primary key,
 * all of the key attributes are present. Since BatchGetItem doesn't support a
 * filter expression, we can only use getBatch if no filter is needed.
 *
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
 *
 * This method cannot filter which keys are used for lookup from the keys
 * object. It means that you can only pass in keys that are used for lookup.
 *
 * @param model
 * @returns
 */
function createBatchGet<I extends Item>(model: ModelType<I>) {
  function isBatchable(model: ModelType<Item>, batchKey: BatchKey<Item>): boolean {
    if (batchKey.options) {
      return false;
    }
    const { query } = batchKey;
    const { hashKey, rangeKey } = model.table();
    if (!hashKey) {
      throw new Error("Table must have a hashKey");
    }
    if (!(hashKey in query)) {
      throw new Error("Query must contain hashKey");
    }
    // If hashkey query is not a string or number, it is not batchable
    if (!["string", "number"].includes(typeof query[hashKey as keyof typeof query])) {
      return false;
    }
    // If the primary key has only a hash key
    if (Object.keys(query).length == 1 && hashKey in query && !rangeKey) {
      return true;
    }
    // If only rangeKey and primaryKey are present
    if (
      rangeKey &&
      Object.keys(query).length == 2 &&
      hashKey in query &&
      rangeKey in query &&
      ["string", "number"].includes(typeof query[rangeKey as keyof typeof query])
    ) {
      return true;
    }
    return false;
  }

  return async (bkArray: ReadonlyArray<BatchKey<I>>): Promise<DataLoaderResult<I>[]> => {
    type BatchableItem = { batchable: boolean; ko: KeyObject; index: number };
    type UnbatchableItem = { batchable: boolean; bk: BatchKey<I>; index: number };
    const batchable: BatchableItem[][] = [];
    const unbatchable: UnbatchableItem[] = [];
    const results = new Array<DataLoaderResult<I>>(bkArray.length).fill({ items: [], total: 0 });

    /* Split the keys into batchable and unbatchable. Batchable keys are grouped
    into 100 keys mini batches. */
    for (const [index, bk] of bkArray.entries()) {
      if (isBatchable(model, bk)) {
        if (batchable.length === 0 || batchable.at(-1)!.length >= 100) {
          batchable.push([]);
        }
        batchable.at(-1)!.push({ ko: bk.query as KeyObject, index, batchable: true });
      } else {
        unbatchable.push({ bk, index, batchable: false });
      }
    }

    async function queryUnbatchable(bk: BatchKey<I>): Promise<DataLoaderResult<I>> {
      if (process.env.LOG_DATALOADER === "1") {
        console.log("Query unbatchable", bk);
      }
      let query: DynamogooseQuery<I> = model.query(bk.query).using({ auto: false });
      const { lastKey: prevLastKey } = bk.options?.cursor ?? {};
      if (prevLastKey) {
        query = query.startAt(prevLastKey);
      }
      if (bk.options != undefined) {
        query = applyBatchOptionsToQuery(query, bk.options);
      }
      const execResult = await query.exec();
      const { count, lastKey } = execResult;
      return {
        items: await Promise.all(execResult.map(assignDefaults)),
        cursor: lastKey ? { lastKey } : undefined,
        total: count,
      };
    }

    if (process.env.LOG_DATALOADER === "1") {
      console.log("Query batchable", batchable);
      console.log("Query unbatchable", unbatchable);
    }

    /* We can batch mini-batchables and unbatchables all together. */
    await settlePromisesInBatches<BatchableItem[] | UnbatchableItem, void>(
      [...batchable, ...unbatchable],
      async (arg) => {
        if (arg instanceof Array) {
          // arg is 100 keys mini batch
          const keys = arg.map((b) => b.ko);
          if (process.env.LOG_DATALOADER === "1") {
            console.log("BatchGet", keys);
          }
          const batchResult = await model.batchGet(keys);
          const { unprocessedKeys } = batchResult;
          if (unprocessedKeys.length > 0) {
            throw new Error(`Unprocessed keys: ${JSON.stringify(unprocessedKeys)}`);
          }
          for (const [index, item] of batchResult.entries()) {
            results[arg[index].index] = { items: [await assignDefaults(item)], total: 1 };
          }
        } else {
          results[arg.index] = await queryUnbatchable(arg.bk);
        }
      },
      {
        batchSize: 10,
      }
    );

    if (process.env.LOG_DATALOADER === "1") {
      console.log("dataloader load results", results);
    }
    return results;
  };
}

type WithNullKeysRemoved<T> = { [K in keyof T]: T[K] extends null | undefined ? never : T[K] };
function stripNullKeys<T>(
  object: T,
  options?: { returnUndefinedIfNothingLeft?: boolean; deep?: boolean }
): WithNullKeysRemoved<T> | undefined {
  function _stripNullKeys<T extends object>(
    object: unknown,
    options?: { returnUndefinedIfNothingLeft?: boolean; deep?: boolean }
  ): unknown {
    if (object === null || typeof object !== "object") {
      return object;
    }
    if (Array.isArray(object)) {
      return object.map((item) => _stripNullKeys(item, options)) as T;
    }
    const data: Partial<T> = {};
    // eslint-disable-next-line prefer-const
    for (let [key, val] of Object.entries(object) as [keyof T, any][]) {
      if (options?.deep) {
        val = _stripNullKeys(val, options);
      }
      if (val !== undefined && val !== null) {
        data[key] = val as T[keyof T];
      }
    }
    if (options?.returnUndefinedIfNothingLeft && Object.keys(data).length == 0) {
      return undefined;
    }
    return data;
  }
  return _stripNullKeys(object, options) as WithNullKeysRemoved<T> | undefined;
}

// class Cache {
//     _cache = new Map<string, any>();
//     constructor() {}
//     get(key: string) {
//         console.log(this._cache);
//         console.log("Cache.get", key);
//         return this._cache.get(key);
//     }
//     set(key: string, value: any) {
//         console.log("Cache.set", key, value);
//         this._cache.set(key, value);
//         console.log(this._cache);
//     }
//     delete(key: string) {
//         console.log("Cache.delete", key);
//         this._cache.delete(key);
//     }
//     clear() {
//         console.log("Cache.clear");
//         this._cache.clear();
//     }
// }
type PageResult<I> = { items: I[]; next?: Cursor; total: number };

export class Batched<I extends Item, CreateProps extends Partial<I>> {
  /**
   * Wrapps the dataloader to provide a get method that throws a NotFound
   * error if the item is not found.
   *
   * Note: You must create an instance for every request. The cache is not
   * meant to be persistent.
   */
  public loader: DataLoader<BatchKey<I>, DataLoaderResult<I>>;
  constructor(public model: ModelType<I>) {
    this.loader = new DataLoader(createBatchGet(model), {
      // cacheMap: new Cache(),
      cacheKeyFn(bk: BatchKey<I>) {
        if (typeof bk.query === "string" && bk.options === undefined) {
          return bk.query;
        } else {
          return hash.MD5(bk);
        }
      },
    });
  }

  /**
   * Gets one object with the lookup key. If more than one object is found, it
   * throws an error because it is likely a design error with the GraphQL
   * schema. If no object is found, it throws a NotFound error to the client
   * because it is likely a user error.
   *
   * If key is an object, all properties must be either a hash key, a range
   * key, or an index. If anything else is passed in, it will be passed to
   * DynamoDB and DynamoDB will raise an error.
   *
   * @param key Support the hash key, or an object that will be passed to
   * dynamoose.Model.query().
   * @returns An object of the model type.
   */
  async get(key: Query<I>, options?: BatchQueryOptions): Promise<I> {
    const result = await this.many(key, options);
    if (result.length === 0) {
      throw new NotFound(this.model.name, key);
    } else if (result.length > 1) {
      throw new Error(`Found more than one ${this.model.name} with key ${JSON.stringify(key)}`);
    } else {
      return result[0];
    }
  }

  async getOrNull(key: Query<I>, options?: BatchQueryOptions): Promise<I | null> {
    const result = await this.many(key, options);
    if (result.length === 0) {
      return null;
    } else if (result.length > 1) {
      throw new Error(`Found more than one ${this.model.name} with key ${JSON.stringify(key)}`);
    } else {
      return result[0];
    }
  }

  async createOverwrite(data: Partial<I>, options?: BatchQueryOptions): Promise<I> {
    const lookupKeys = extractKeysFromItems(this.model, data);
    const item = await this.getOrNull(lookupKeys, options);
    if (item === null) {
      return await this.create(data as CreateProps);
    } else {
      const nonPKData = { ...data };
      for (const pkPart of Object.keys(lookupKeys)) {
        delete nonPKData[pkPart];
      }
      return await this.update(item, nonPKData);
    }
  }

  async assertExists(key: Query<I>): Promise<void> {
    await this.get(key);
  }

  async many(lookup: Query<I>, lookupOptions?: BatchQueryOptions): Promise<I[]> {
    const { items } = await this.page(lookup, lookupOptions);
    return items;
  }

  /**
   * Gets one object with the lookup key. Returns an array of items found.
   *
   * If key is an object, all properties must be either a hash key, a range
   * key, or an index. If anything else is passed in, it will be passed to
   * DynamoDB and DynamoDB will raise an error.
   *
   * @key Support the hash key, or an object that will be passed to
   * dynamoose.Model.query().
   * @options
   *   @using Use an index to lookup the item, assuming the index contains
   *          only the primary key. This will cause a second lookup to get the
   *          actual objects with the primary keys.
   *   @sort descending or ascending, sorted by the range key.
   *   @limit The maximum number of items to query. Note that when setting the
   *          limit, DynamoDB looks at most @limit items BEFORE applying the
   *          query. This means that the returned number of items can be less
   *          than the actual number of items matching the query.
   * @returns
   *   @items An array of objects of the model type.
   *   @cursor A cursor to the next page of results. If there are no more
   *   @total The total number of items matching the query.
   */
  async page(
    lookup: Query<I>,
    lookupOptions?: BatchQueryOptions
  ): Promise<{ items: I[]; next: Cursor; total: number }> {
    const query = stripNullKeys(lookup, {
      deep: true,
      returnUndefinedIfNothingLeft: true,
    });
    if (query == undefined) {
      throw new Error("All keys are null");
    }
    let queryOptions: WithNullKeysRemoved<BatchQueryOptions> | undefined = undefined;
    if (lookupOptions != undefined) {
      queryOptions = stripNullKeys(lookupOptions, {
        deep: true,
        returnUndefinedIfNothingLeft: true,
      });
    }
    // If index is used, first use the index to get the primary keys, then
    // do a second lookup with the primary keys.
    if (queryOptions?.using) {
      // The result only contains primary keys
      const { items, cursor, total } = await this.loader.load({
        query,
        options: queryOptions,
      });
      const primaryKeys = items.map((item) => extractKeysFromItems(this.model, item));
      // Options shouldn't be needed this time.
      const results = await Promise.all(primaryKeys.map((pk) => this.loader.load({ query: pk })));
      const aggregatedResults = {
        items: [] as I[],
        next: cursor!,
        total,
      };
      for (const result of results) {
        aggregatedResults.items.push(...result.items);
      }
      return aggregatedResults;
    } else {
      const { items, cursor, total } = await this.loader.load({
        query,
        options: queryOptions,
      });
      return {
        items,
        total,
        next: cursor!,
      };
    }
  }

  async *manyGenerator(lookup: Query<I>, lookupOptions?: BatchQueryOptions): AsyncGenerator<I, void, undefined> {
    let cursor: Cursor | undefined = undefined;
    do {
      const page: PageResult<I> = await this.page(lookup, { ...lookupOptions, cursor });
      const { next, items } = page;
      cursor = next;
      yield* items;
    } while (cursor);
  }

  async count(lookup: Query<I>, options?: BatchQueryOptions): Promise<number> {
    let query = this.model.query(stripNullKeys(lookup));
    if (options != undefined) {
      options = stripNullKeys(options, {
        deep: true,
        returnUndefinedIfNothingLeft: true,
      });
    }
    if (options != undefined) {
      query = applyBatchOptionsToQuery(query, options);
    }
    const result = await query.count().exec();
    return result.count;
  }

  async exists(key: Query<I>, options?: BatchQueryOptions): Promise<boolean> {
    const result = await this.many(key, options);
    return result.length > 0;
  }

  async create(item: CreateProps): Promise<I> {
    const stripped = stripNullKeys(item);
    if (stripped == undefined) {
      throw new Error("Object is empty.");
    }
    const maxAttempts = 10;
    for (let retries = 0; retries < maxAttempts; retries++) {
      try {
        const result = await this.model.create(stripped as Partial<I>);
        if (retries > 0) {
          console.warn(`Retried ${retries} times to create ${this.model.name} ${JSON.stringify(item)}`);
        }
        this.clearCache();
        return result;
      } catch (e) {
        // We want to catch the case where the item already exists. DynamoDB
        // in this case throws a ConditionalCheckFailedException. But it
        // also throws this exception in other cases. So a check using the
        // .exists() call is needed to confirm that the item already exists.
        if (e instanceof ConditionalCheckFailedException) {
          const query = extractKeysFromItems(this.model, stripped as Partial<I>);
          if (await this.exists(query as Query<I>)) {
            throw new AlreadyExists(this.model.name, item);
          } else if (retries < maxAttempts - 1) {
            // The insert could fail when the item uses createdAt as
            // a range key. In this case we just retry the insert.
            await sleep(2 ** retries * Math.random());
            continue;
          }
          console.error(e);
          throw e;
        } else {
          console.error(e);
          throw e;
        }
      }
    }
    throw new Error("unreachable");
  }

  async delete(lookup: Partial<I>): Promise<I> {
    const query = extractKeysFromItems(this.model, lookup);
    const item = await this.get(query);
    await item.delete();
    this.clearCache();
    return item;
  }

  async deleteIfExists(keys: Partial<I>): Promise<I | null> {
    try {
      return await this.delete(keys);
    } catch (e) {
      if (e instanceof NotFound) {
        return null;
      }
      throw e;
    }
  }

  async deleteMany(query: Partial<I>, options?: BatchQueryOptions): Promise<I[]> {
    const items = await this.many(query, options);
    const deleteChunk = async (batch: I[]) => {
      const pks = batch.map((x) => extractKeysFromItems(this.model, x));
      await this.model.batchDelete(pks as KeyObject[]);
    };

    // Split the batch into chunks, and call batchGet100Max on each chunk
    const promises: Promise<void>[] = [];
    const batchSize = 25;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, Math.min(i + batchSize, items.length));
      promises.push(deleteChunk(batch));
    }
    await Promise.all(promises);
    this.clearCache();
    return items;
  }

  /**
   * Look up the item with the given keys, and update the item with the given
   * new values. The new values cannot contain the hash key or the range key.
   * It is normal to use get() to look up the item, and then update the item
   * by putting the item in the first argument.
   *
   * @param lookup A primary + range key (optional) to lookup the item. If extra
   * keys are provided, they are ignored.
   * @param newVals New values for the item. If the new values contain the
   * range key, the range key is updated. Any value that is undefined or null
   * is ignored.
   * @returns The updated object.
   */
  // Why a separate keys object is needed: this is to differentiate between
  // when the client wants to update a range key vs. when the client wants to
  // use the range only for lookup.
  //
  // The hash key and the range key cannot be updated. This design is
  // intentional, because we assumes that relational objects are referenced by
  // each other by the primary key. If primary keys are allowed to be updated,
  // then it is possible that the relational objects would refer to an object
  // that no longer exists, or an wrong object. It is too easy to make
  // mistakes. So we disallow updating the primary key. If updating the
  // primary key is needed, the client should delete the old object and create
  // a new one.
  async update(lookup: Partial<I>, newVals: UpdateQuery<I>): Promise<I> {
    const stripped = stripNullKeys(newVals, {
      deep: true,
      returnUndefinedIfNothingLeft: true,
    });
    if (stripped === undefined) {
      return await this.get(lookup);
    }
    return this.updateWithNull(lookup, stripped);
  }

  async updateWithNull(lookup: Partial<I>, newVals: UpdateQuery<I>): Promise<I> {
    // Extract keys to ingore extra properties
    const query = extractKeysFromItems(this.model, lookup);
    /* Need to manually check if the item exists. */
    const item = await this.get(query);
    if (Object.keys(newVals).length == 0) {
      return item;
    }
    const hashKeyName = this.model.table().hashKey;
    if (newVals && hashKeyName in newVals) {
      throw new UpdateContainsPrimaryKey(this.model.name, hashKeyName, newVals);
    }
    if (!(hashKeyName in query)) {
      throw new Error(`Query must contain hash key ${hashKeyName}`);
    }
    const rangeKeyName = this.model.table().rangeKey;
    if (rangeKeyName && rangeKeyName in newVals) {
      throw new UpdateContainsPrimaryKey(this.model.name, rangeKeyName, newVals);
    }
    if (rangeKeyName && !(rangeKeyName in query)) {
      throw new Error(`Query must contain range key ${rangeKeyName}`);
    }
    if (newVals === undefined) {
      return item;
    }
    const result = await this.model.update(query as unknown as Partial<I>, newVals as unknown as Partial<I>);
    this.clearCache();
    return result;
  }

  async *scan(
    query: Query<I> = {},
    { batchSize = 100, limit = Infinity, ...options }: BatchScanOptions = {}
  ): AsyncIterable<I[]> {
    const baseQuery = applyBatchOptionsToScan(this.model.scan(query), options);
    let remaining = limit as number;
    let response = await baseQuery.limit(Math.min(batchSize, remaining)).exec();
    if (response.length > 0) {
      remaining = Math.max(0, remaining - response.length);
      yield response;
    }
    while (response.lastKey && remaining > 0) {
      response = await baseQuery.startAt(response.lastKey).limit(Math.min(batchSize, remaining)).exec();
      if (response.length > 0) {
        remaining = Math.max(0, remaining - response.length);
        yield response;
      }
    }
  }

  clearCache() {
    this.loader.clearAll();
  }
}

async function sleep(miliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, miliseconds));
}
