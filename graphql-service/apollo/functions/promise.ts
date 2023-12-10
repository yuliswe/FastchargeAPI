export function getAllSettledOrFail<T>(results: PromiseSettledResult<T>[]): T[] {
    const errors = results.filter((r) => r.status === "rejected");
    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }
    return results.map((r: PromiseFulfilledResult<T>) => r.value);
}

export async function safelySettlePromisesInBatchesByIterator<Arg, PromiseValue>(
    args: Iterator<Arg>,
    handler: (args: Arg, index: number) => Promise<PromiseValue>,
    { batchSize }: { batchSize: number }
): Promise<PromiseSettledResult<PromiseValue>[]> {
    const results: PromiseSettledResult<PromiseValue>[] = [];
    let nextBatch = takeNextN(batchSize, args);
    while (nextBatch.length > 0) {
        results.push(...(await Promise.allSettled(nextBatch.map(handler))));
        nextBatch = takeNextN(batchSize, args);
    }
    return results;
}

export async function settlePromisesInBatches<Arg, PromiseValue>(
    args: Arg[],
    handler: (args: Arg, index: number) => Promise<PromiseValue>,
    { batchSize }: { batchSize: number }
): Promise<PromiseSettledResult<PromiseValue>[]> {
    return safelySettlePromisesInBatchesByIterator(args[Symbol.iterator](), handler, { batchSize });
}

function takeNextN<T>(n: number, iterator: Iterator<T>): T[] {
    if (n <= 0) {
        return [];
    }
    const results: T[] = [];
    let next = iterator.next();
    while (!next.done && n > 0) {
        results.push(next.value);
        n--;
        if (n > 0) {
            next = iterator.next();
        }
    }
    return results;
}
