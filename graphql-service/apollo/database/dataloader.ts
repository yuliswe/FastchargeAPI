import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import DataLoader from "dataloader";
import { InputKey, KeyObject, ModelType } from "dynamoose/dist/General";
import { Item } from "dynamoose/dist/Item";
import { Query as DynamogooseQuery, Scan as DynamogooseScan } from "dynamoose/dist/ItemRetriever";
import hash from "object-hash";
import { AlreadyExists, NotFound, UpdateContainsPrimaryKey } from "../errors";
import { GQLPartial } from "./utils";

type Optional<T> = T | undefined | null;
type ConditionQuery<V> = {
    where?: Optional<V>;
    filter?: Optional<V>;
    attribute?: Optional<V>;
    eq?: Optional<V>;
    lt?: Optional<V>;
    le?: Optional<V>;
    gt?: Optional<V>;
    ge?: Optional<V>;
    beginsWith?: Optional<V>;
    contains?: Optional<V>;
    // exists?: () => Condition;
    in?: V[];
    between?: [V, V];
};
type Query<T> = {
    [K in keyof T & string]?: Optional<T[K] | ConditionQuery<T[K]>>;
};
type UpdateQuery<T> = NormalUpdateQuery<T> | AdvancedUpdateQuery<T>;
type NormalUpdateQuery<T> = {
    [K in keyof T]?: Optional<T[K] | ConditionQuery<T[K]>>;
};
type AdvancedUpdateQuery<T> = {
    $SET?: NormalUpdateQuery<T>;
    $REMOVE?: (keyof T)[];
    $ADD?: NormalUpdateQuery<T>;
    $DELETE?: NormalUpdateQuery<T>;
};
/**
 * This file is a collection of functions that are used to bridge Dynamoose with
 * DataLoader.
 */

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
function extractKeysFromItems<I extends Item>(model: ModelType<I>, item: GQLPartial<I>): Partial<I> {
    const hashKeyName = model.table().hashKey;
    const rangeKeyName: keyof I | undefined = model.table().rangeKey as keyof I;
    const query = {
        [hashKeyName]: item[hashKeyName as keyof I],
    } as Partial<I>;
    if (rangeKeyName != undefined && item[rangeKeyName] != null) {
        query[rangeKeyName] = item[rangeKeyName]!;
    }
    return query;
}

async function assignDefaults<I extends Item>(item: I): Promise<I> {
    // TODO: There is a bug with item.withDefaults(), in that in converts a Date
    // type to a string. This may cause issues when the item is saved back to
    // the DB, failing the validation because the DB expects a Date type.
    const defaults = (await item.withDefaults()) as I;
    for (const key of Object.keys(defaults) as (keyof I)[]) {
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

type PrimaryKey = string | number;
type BatchQueryOptions = {
    limit?: number | null;
    sort?: "ascending" | "descending" | null;
    using?: string | null; // Index name
    consistent?: boolean; // Use consistent read
    batchSize?: number; // Number of items to get per batch
};
type BatchKey<I extends Item> = {
    query: PrimaryKey | Query<I>;
    options?: BatchQueryOptions;
};
type BatchScanOptions = {
    limit?: number | null;
    using?: string | null; // Index name
    consistent?: boolean; // Use consistent read
    batchSize?: number; // Number of items to get per batch
};

/**
 * Used by DataLoader, this function takes a list of filter conditions and
 * returns a list of items of the same count.
 *
 * Possible valid filter conditions:
 *
 * 1. A string, which is the partition key
 * 2. An object which is the primary/index/partition key + key value:
 *      {"breed": "Pug", "name": "Fido"}
 * 3. An object which is the primary/index/partition key + filter condition:
 *      {"breed": {"contains": "Terrier"}}
 *
 * This method cannot filter which keys are used for lookup from the keys
 * object. It means that you can only pass in keys that are used for lookup.
 *
 * @param model
 * @returns
 */
function createBatchGet<I extends Item>(model: ModelType<I>) {
    // At the moment, DynamoDB's BatchGetItem can handle at most 100 items at a
    // time
    async function batchGet100Max(bkArray: BatchKey<I>[]): Promise<I[][]> {
        if (bkArray.length > 100) {
            throw new Error("Cannot batch get more than 100 items at a time");
        }
        // Type 1 is when the query contains only a hashKey, and the table only
        // has a hashKey as well (no rangeKey)
        const batch1: PrimaryKey[] = [];
        // Type 2 is when the query contains a hashKey and a rangeKey, and the
        // table has both a hashKey and a rangeKey.
        const batch2: Query<I>[] = [];
        // Other types are unbatchable
        const unbatchable: number[] = [];
        const bkType: number[] = [];
        const resultArr: I[][] = Array(bkArray.length).fill([]) as I[][];
        const hashKeyName = model.table().hashKey as keyof I & string;
        const rangeKeyName = model.table().rangeKey as (keyof I & string) | undefined;
        for (const [index, bk] of bkArray.entries()) {
            // Case 1: query is a hashkey string
            if (
                hashKeyName &&
                !rangeKeyName &&
                typeof bk.query === "string" &&
                (!bk.options || Object.keys(bk.options).length == 0)
            ) {
                batch1.push(bk.query);
                bkType.push(1);
            }
            // Case 2: query is an object containing only the hashkey
            else if (
                hashKeyName &&
                !rangeKeyName &&
                typeof bk.query === "object" &&
                Object.keys(bk.query).length === 1 &&
                Object.keys(bk.query)[0] === hashKeyName &&
                (!bk.options || Object.keys(bk.options).length == 0)
            ) {
                batch1.push(bk.query[hashKeyName] as PrimaryKey);
                bkType.push(1);
            }
            // Case 3: query is an object containing only the hashkey and the
            // range key
            else if (
                hashKeyName &&
                rangeKeyName &&
                typeof bk.query === "object" &&
                Object.keys(bk.query).length === 2 &&
                Object.keys(bk.query).includes(hashKeyName) &&
                Object.keys(bk.query).includes(rangeKeyName) &&
                (!bk.options || Object.keys(bk.options).length == 0)
            ) {
                batch2.push(bk.query);
                bkType.push(2);
            }
            // Other cases are unbatchable
            else {
                // could be a pk (string or object) with options
                unbatchable.push(index);
                bkType.push(3);
            }
        }

        function queryUnbatchable(index: number): Promise<I[]> {
            const bk = bkArray[index];
            let query: DynamogooseQuery<I>;
            if (typeof bk.query === "string") {
                query = model.query(hashKeyName).eq(bk.query);
            } else if (typeof bk.query === "object") {
                query = model.query(bk.query);
            } else {
                throw new Error("Invalid query type: " + typeof bk.query + " " + bk.query.toString());
            }
            query = query.using({ auto: false });
            if (bk.options != undefined) {
                query = applyBatchOptionsToQuery(query, bk.options);
            }
            return query.exec();
        }

        // Type 1 and 2 can be batched at once.
        const [result1, result2, ...result3] = await Promise.all([
            batch1.length > 0 ? model.batchGet(batch1) : [], // an array of I
            batch2.length > 0 ? model.batchGet(batch2 as InputKey[]) : [], // an array of I
            ...unbatchable.map(queryUnbatchable), // multiple arrays of I[]
        ]);

        const promises = [];
        for (const [index, items] of result3.entries()) {
            const promise = Promise.all(items.map(assignDefaults)).then((result) => {
                resultArr[unbatchable[index]] = result;
                return result;
            });
            promises.push(promise);
        }

        const keyMap1 = new Map<PrimaryKey, I[]>();
        for (const item of result1) {
            // batch1 only contains hashKey
            const promise = assignDefaults(item).then((item) => {
                const key = item[hashKeyName] as PrimaryKey;
                if (keyMap1.has(key)) {
                    keyMap1.get(key)?.push(item);
                } else {
                    keyMap1.set(key, [item]);
                }
            });
            promises.push(promise);
        }

        const keyMap2 = new Map<string, I[]>();
        for (const item of result2) {
            // batch2 only contains hashKey and rangeKey
            const promise = assignDefaults(item).then((item) => {
                const key = [item[hashKeyName], item[rangeKeyName!]].toString();
                if (keyMap2.has(key)) {
                    keyMap2.get(key)?.push(item);
                } else {
                    keyMap2.set(key, [item]);
                }
            });
            promises.push(promise);
        }

        await Promise.all(promises);

        for (const [index, type] of bkType.entries()) {
            if (type === 1) {
                resultArr[index] = keyMap1.get(batch1[index]) || [];
            } else if (type === 2) {
                const key = [batch2[index][hashKeyName], batch2[index][rangeKeyName!]].toString();
                resultArr[index] = keyMap2.get(key) || [];
            }
        }

        return resultArr;
    }

    // Split the batch into chunks of 100, and call batchGet100Max on each chunk
    return async (bkArray: BatchKey<I>[]): Promise<I[][]> => {
        const promises: Promise<I[][]>[] = [];
        for (let i = 0; i < bkArray.length; i += 100) {
            const batch = bkArray.slice(i, Math.min(i + 100, bkArray.length));
            const result = batchGet100Max(batch);
            promises.push(result);
        }
        const results = await Promise.all(promises);
        return results.flat();
    };
}

function stripNullKeys<T extends object>(
    object: T,
    options?: { returnUndefined?: boolean; deep?: boolean }
): Partial<T> | undefined {
    if (object === null || typeof object !== "object") {
        return object;
    }
    if (Array.isArray(object)) {
        return object.map((item) => stripNullKeys(item, options)) as T;
    }
    const data: Partial<T> = {};
    // eslint-disable-next-line prefer-const
    for (let [key, val] of Object.entries(object) as [keyof T, any][]) {
        if (options?.deep) {
            val = stripNullKeys(val, options);
        }
        if (val !== undefined && val !== null) {
            data[key] = val as T[keyof T];
        }
    }
    if (options?.returnUndefined && Object.keys(data).length == 0) {
        return undefined;
    }
    return data;
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

export class Batched<I extends Item, T_CreateProps extends GQLPartial<I>> {
    /**
     * Wrapps the dataloader to provide a get method that throws a NotFound
     * error if the item is not found.
     *
     * Note: You must create an instance for every request. The cache is not
     * meant to be persistent.
     */
    public loader: DataLoader<BatchKey<I>, I[]>;
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

    async createOverwrite(data: GQLPartial<I>, options?: BatchQueryOptions): Promise<I> {
        const lookupKeys = extractKeysFromItems(this.model, data);
        const item = await this.getOrNull(lookupKeys, options);
        if (item === null) {
            return await this.create(data as T_CreateProps);
        } else {
            const nonPKData = { ...data };
            for (const pkPart of Object.keys(lookupKeys)) {
                delete nonPKData[pkPart as keyof I];
            }
            return await this.update(item, nonPKData);
        }
    }

    async assertExists(key: Query<I>): Promise<void> {
        await this.get(key);
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
     * @returns An array of objects of the model type.
     */
    async many(key: Query<I>, options?: BatchQueryOptions): Promise<I[]> {
        let strippedKey;
        if (typeof key === "object") {
            strippedKey = stripNullKeys(key, {
                deep: true,
                returnUndefined: true,
            });
        }
        if (strippedKey == undefined) {
            throw new Error("All keys are null");
        }
        if (options != undefined) {
            options = stripNullKeys(options, {
                deep: true,
                returnUndefined: true,
            });
        }
        // If index is used, first use the index to get the primary keys, then
        // do a second lookup with the primary keys.
        if (options?.using) {
            const result = await this.loader.load({
                query: strippedKey,
                options,
            });
            // The result only contains primary keys
            const primaryKeys = result.map((item) => extractKeysFromItems(this.model, item));
            // Options shouldn't be needed this time.
            const promises = primaryKeys.map((pk) => this.loader.load({ query: pk }));
            const results = await Promise.all(promises);
            return results.flat();
        } else {
            const result = await this.loader.load({
                query: strippedKey,
                options,
            });
            return result;
        }
    }

    async count(key: Query<I>, options?: BatchQueryOptions): Promise<number> {
        if (typeof key === "object") {
            key = stripNullKeys(key)!;
        }
        let query = this.model.query(key);
        if (options != undefined) {
            options = stripNullKeys(options, {
                deep: true,
                returnUndefined: true,
            });
        }
        if (options != undefined) {
            query = applyBatchOptionsToQuery(query, options);
        }
        const result = await query.count().exec();
        return result.count;
    }

    async exists(key: Partial<I>, options?: BatchQueryOptions): Promise<boolean> {
        const result = await this.many(key, options);
        return result.length > 0;
    }

    /**
     * If the item already exists, technically we have three options:
     *
     *  A: Throw an error.
     *  B: Update the item so that the request acts as a "put".
     *  C: Do nothing and return the existing item.
     *
     * Option B has some security implications, because usually in the context
     * where create is called, we only remember to check if the current user has
     * create permission. On the other hand, if we update the item, we might
     * update an item that the user does not have permission to update.
     *
     *
     * Option C has the same problem. Suppose in a context where we want to
     * create an object for the current user, and then do some operation on it.
     * In this case, we might unintentionally do the operation on an object that
     * the user doesn't own.
     *
     * For example:
     * if (user has permission to create app) {
     *      let app = await db.create({name: "my-app"})
     *      // do something with app
     * }
     *
     * This code is wrong if B/C is implemented, because app might be another
     * app.
     */
    async create(item: T_CreateProps): Promise<I> {
        const stripped = stripNullKeys(item) as Partial<I>;
        const maxAttempts = 10;
        for (let retries = 0; retries < maxAttempts; retries++) {
            try {
                const result = await this.model.create(stripped);
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
                    const query = extractKeysFromItems(this.model, stripped);
                    if (await this.exists(query)) {
                        throw new AlreadyExists(this.model.name, item);
                    } else if (retries < maxAttempts - 1) {
                        // The insert could fail when the item uses createdAt as
                        // a range key. In this case we just retry the insert.
                        await sleep(2 ** retries * Math.random());
                        continue;
                    } else {
                        console.error(e);
                        throw e;
                    }
                } else {
                    console.error(e);
                    throw e;
                }
            }
        }
        throw new Error("unreachable");
    }

    async delete(keys: string | Partial<I>): Promise<I> {
        let query: Partial<I>;
        if (typeof keys === "string") {
            query = { [this.model.table().hashKey]: keys } as Partial<I>;
        } else {
            query = extractKeysFromItems(this.model, keys);
        }
        const item = await this.get(query);
        this.clearCache();
        await item.delete();
        return item;
    }

    async deleteIfExists(keys: string | Partial<I>): Promise<I | null> {
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
     * @param keys A primary + range key (optional) to lookup the item. If extra
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
    async update(keys: GQLPartial<I>, newVals: UpdateQuery<I>): Promise<I> {
        newVals = stripNullKeys(newVals, {
            deep: true,
            returnUndefined: true,
        })!;
        return this.updateWithNull(keys, newVals);
    }

    async updateWithNull(keys: GQLPartial<I>, newVals: UpdateQuery<I>): Promise<I> {
        // Extract keys to ingore extra properties
        const query = extractKeysFromItems(this.model, keys);

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
            return await this.get(query);
        }

        let result: I;
        try {
            result = await this.model.update(query as unknown as Partial<I>, newVals as unknown as Partial<I>);
        } catch (e) {
            await this.get(query); // Check if the item exists, throws NotFound if not
            throw e;
        }
        this.clearCache();
        return result;
    }

    async *scan(
        conditions: ConditionQuery<I> = {},
        { batchSize = 100, limit = Infinity, ...options }: BatchScanOptions = {}
    ): AsyncIterable<I[]> {
        const baseQuery = applyBatchOptionsToScan(this.model.scan(conditions), options);
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
    // prime(values: Iterable<I>) {
    //     let keyName = this.model.table().hashKey;
    //     let keyMap = new Map();
    //     for (let v of values) {
    //         let hashKey = v[keyName];
    //         if (!keyMap.has(hashKey)) {
    //             keyMap.set(hashKey, []);
    //         }
    //         let arr = keyMap.get(hashKey);
    //         arr.push(v);
    //     }
    //     for (let [key, value] of keyMap) {
    //         this.loader.prime(key, value);
    //     }
    // }

    clearCache() {
        this.loader.clearAll();
    }
}

async function sleep(miliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, miliseconds));
}
