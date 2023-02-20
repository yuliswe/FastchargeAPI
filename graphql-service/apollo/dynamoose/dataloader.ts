import DataLoader from "dataloader";
import { InputKey, ModelType } from "dynamoose/dist/General";
import { Item } from "dynamoose/dist/Item";
import { AlreadyExists, NotFound, UpdateContainsPrimaryKey } from "../errors";
import { AppModel, User, UserModel } from "./models";
import hash from "object-hash";
import {
    ConditionalCheckFailedException,
    ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import { Condition } from "dynamoose";

type ConditionQuery<V> = {
    where?: V;
    filter?: V;
    attribute?: V;
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
type Query<T> = { [K in keyof T]?: T[K] | ConditionQuery<T[K]> };
/**
 * This file is a collection of functions that are used to bridge Dynamoose with
 * DataLoader.
 */

/**
 * Extracts primary key from item, and if present, the range key too.
 * @param model
 * @param item
 * @returns An object { [hashKeyName]: hashKey, [rangeKeyName]?: rangeKey }
 */
function extractKeysFromItems<I extends Item>(
    model: ModelType<I>,
    item: Partial<I>
): Partial<I> {
    let hashKeyName = model.table().hashKey;
    let rangeKeyName: keyof I | undefined = model.table().rangeKey as keyof I;
    let query = {
        [hashKeyName]: item[hashKeyName as keyof I],
    } as Partial<I>;
    if (rangeKeyName != undefined) {
        query[rangeKeyName] = item[rangeKeyName];
    }
    return query;
}

async function assignDefaults<I extends Item>(item: I): Promise<I> {
    // TODO: There is a bug with item.withDefaults(), in that in converts a Date
    // type to a string. This may cause issues when the item is saved back to
    // the DB, failing the validation because the DB expects a Date type.
    let defaults = (await item.withDefaults()) as I;
    for (let key of Object.keys(item) as (keyof I)[]) {
        // This is a temporary fix, but if the item's date field is undefined
        // (maybe an old object before a schema added a new date field), then
        // the problem still exists. The workaround is to not ever use the Date
        // type on the DB schema, and instead use a Number type.
        if (item[key] === undefined) {
            item[key] = defaults[key];
        }
    }
    return item;
}

type PrimaryKey = string | number;
type BatchOptions = {
    limit?: number;
    sort?: "ascending" | "descending";
    using?: string;
};
type BatchKey<I extends Item> = {
    query: PrimaryKey | Query<I>;
    options?: BatchOptions;
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
    return async (bkArray: BatchKey<I>[]): Promise<I[][]> => {
        // Type 1 is when the query contains only a hashKey, and the table only
        // has a hashKey as well (no rangeKey)
        let batch1: PrimaryKey[] = [];
        // Type 2 is when the query contains a hashKey and a rangeKey, and the
        // table has both a hashKey and a rangeKey.
        let batch2: Query<I>[] = [];
        // Other types are unbatchable
        let unbatchable: number[] = [];
        let bkType: number[] = [];
        let resultArr: I[][] = Array(bkArray.length).fill([]);
        let hashKeyName = model.table().hashKey as keyof I & string;
        let rangeKeyName = model.table().rangeKey as
            | (keyof I & string)
            | undefined;
        for (let [index, bk] of bkArray.entries()) {
            if (
                hashKeyName &&
                !rangeKeyName &&
                typeof bk.query === "string" &&
                (!bk.options || Object.keys(bk.options).length == 0)
            ) {
                batch1.push(bk.query);
                bkType.push(1);
            } else if (
                hashKeyName &&
                !rangeKeyName &&
                typeof bk.query === "object" &&
                Object.keys(bk.query).length === 1 &&
                Object.keys(bk.query)[0] === hashKeyName &&
                (!bk.options || Object.keys(bk.options).length == 0)
            ) {
                batch1.push(bk.query[hashKeyName as PrimaryKey]);
                bkType.push(1);
            } else if (
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
            } else {
                // could be a pk (string or object) with options
                unbatchable.push(index);
                bkType.push(3);
            }
        }

        function queryUnbatchable(index: number): Promise<I[]> {
            let bk = bkArray[index];
            let query;
            if (typeof bk.query === "string") {
                query = model.query(hashKeyName).eq(bk.query);
            } else if (typeof bk.query === "object") {
                query = model.query(bk.query);
            }
            if (bk.options) {
                if (bk.options.limit) {
                    query = query.limit(bk.options.limit);
                }
                if (bk.options.sort) {
                    query = query.sort(bk.options.sort);
                }
                if (bk.options.using) {
                    query = query.using(bk.options.using);
                }
            }
            return query.exec();
        }

        // Type 1 and 2 can be batched at once.
        let [result1, result2, ...result3] = await Promise.all([
            batch1.length > 0 ? model.batchGet(batch1) : [], // an array of I
            batch2.length > 0 ? model.batchGet(batch2 as InputKey[]) : [], // an array of I
            ...unbatchable.map(queryUnbatchable), // multiple arrays of I[]
        ]);

        for (let [index, items] of result3.entries()) {
            resultArr[unbatchable[index]] = await Promise.all(
                items.map(assignDefaults)
            );
        }

        let keyMap1 = new Map<PrimaryKey, I[]>();
        for (let item of result1) {
            // batch1 only contains hashKey
            item = await assignDefaults(item);
            let key = item[hashKeyName] as PrimaryKey;
            if (keyMap1.has(key)) {
                keyMap1.get(key)?.push(item);
            } else {
                keyMap1.set(key, [item]);
            }
        }

        let keyMap2 = new Map<string, I[]>();
        for (let item of result2) {
            // batch2 only contains hashKey and rangeKey
            item = await assignDefaults(item);
            let key = [item[hashKeyName], item[rangeKeyName]].toString();
            if (keyMap2.has(key)) {
                keyMap2.get(key)?.push(item);
            } else {
                keyMap2.set(key, [item]);
            }
        }

        for (let [index, type] of bkType.entries()) {
            if (type === 1) {
                resultArr[index] = keyMap1.get(batch1[index]) || [];
            } else if (type === 2) {
                let key = [
                    batch2[index][hashKeyName],
                    batch2[index][rangeKeyName],
                ].toString();
                resultArr[index] = keyMap2.get(key) || [];
            }
        }

        return resultArr;
    };
}

/**
 * Possible doesn't work, because the GraphQL API doesn't seem to ever give an
 * undefined value. It always gives null instead.
 */
function stripUndefinedKeys<T>(object: T) {
    let data: Partial<T> = {};
    for (let [key, val] of Object.entries(object)) {
        if (val !== undefined) {
            data[key] = val as keyof T;
        }
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

export class Batched<I extends Item> {
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
    async get(key: string | Query<I>, options?: BatchOptions): Promise<I> {
        let result = await this.many(key, options);
        if (result.length === 0) {
            throw new NotFound(this.model.name, JSON.stringify(key));
        } else if (result.length > 1) {
            throw new Error(
                `Found more than one ${
                    this.model.name
                } with key ${JSON.stringify(key)}`
            );
        } else {
            return result[0];
        }
    }

    async getOrNull(
        key: string | Query<I>,
        options?: BatchOptions
    ): Promise<I | null> {
        try {
            return await this.get(key, options);
        } catch (e) {
            if (e instanceof NotFound) {
                return null;
            } else {
                throw e;
            }
        }
    }

    async assertExists(key: string | Query<I>): Promise<void> {
        await this.get(key);
    }

    /**
     * Gets one object with the lookup key. Returns an array of items found.
     *
     * If key is an object, all properties must be either a hash key, a range
     * key, or an index. If anything else is passed in, it will be passed to
     * DynamoDB and DynamoDB will raise an error.
     *
     * If key is an object, all properties must be either a hash key, a range
     * key, or an index. If anything else is passed in, it will be passed to
     * DynamoDB and DynamoDB will raise an error.
     *
     * @param key Support the hash key, or an object that will be passed to
     * dynamoose.Model.query().
     * @returns An array of objects of the model type.
     */
    async many(key: string | Query<I>, options?: BatchOptions): Promise<I[]> {
        if (!key) {
            return [];
        }
        if (typeof key === "object") {
            key = stripUndefinedKeys(key);
        }
        let result = await this.loader.load({
            query: key,
            options,
        });
        return await Promise.all(result);
    }

    async exists(key: string | Partial<I>): Promise<boolean> {
        let result = await this.many(key);
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
    async create(item: Partial<I>): Promise<I> {
        try {
            return await this.model.create(item);
        } catch (e) {
            // We want to catch the case where the item already exists. DynamoDB
            // in this case throws a ConditionalCheckFailedException. But it
            // also throws this exception in other cases. So a check using the
            // .many() call is needed to confirm that the item already exists.
            if (e instanceof ConditionalCheckFailedException) {
                let query = extractKeysFromItems(this.model, item);
                if ((await this.many(query)).length > 0) {
                    throw new AlreadyExists(
                        this.model.name,
                        JSON.stringify(item)
                    );
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

    async delete(keys: string | Partial<I>): Promise<I> {
        let query;
        if (typeof keys === "string") {
            query = { [this.model.table().hashKey]: keys };
        } else {
            query = extractKeysFromItems(this.model, keys);
        }
        let item = await this.get(query);
        await item.delete();
        return item;
    }

    /**
     * Look up the item with the given keys, and update the item with the given
     * new values. The new values cannot contain the hash key or the range key.
     *
     * @param keys A primary + range key (optional) to lookup the item. If extra
     * keys are provided, they are ignored.
     * @param newVals New values for the item. If the new values contain the
     * range key, the range key is updated. If the new values contain null, the
     * value is set to null. So it is important that the client do not proivde
     * the property if it doesn't want to update it.
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
    async update(keys: Partial<I>, newVals: Partial<I>): Promise<I> {
        newVals = stripUndefinedKeys(newVals);
        // Extract keys to ingore extra properties
        const query = extractKeysFromItems(this.model, keys);
        const original = await this.get(query);

        let hashKeyName = this.model.table().hashKey;
        if (hashKeyName in newVals) {
            throw new UpdateContainsPrimaryKey(
                this.model.name,
                hashKeyName,
                newVals
            );
        }
        let rangeKeyName = this.model.table().rangeKey;
        if (rangeKeyName && rangeKeyName in newVals) {
            throw new UpdateContainsPrimaryKey(
                this.model.name,
                rangeKeyName,
                newVals
            );
        }
        let updated = await this.get(query);
        Object.assign(updated, newVals);

        return (await updated.save()) as I;
    }

    async scan(): Promise<I[]> {
        return await this.model.scan().exec();
    }

    prime(values: Iterable<I>) {
        let keyName = this.model.table().hashKey;
        let keyMap = new Map();
        for (let v of values) {
            let hashKey = v[keyName];
            if (!keyMap.has(hashKey)) {
                keyMap.set(hashKey, []);
            }
            let arr = keyMap.get(hashKey);
            arr.push(v);
        }
        for (let [key, value] of keyMap) {
            this.loader.prime(key, value);
        }
    }
}
