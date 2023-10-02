export async function settlePromisesInBatchesByIterator<T>(
    promises: Iterator<T, T, T>,
    { batchSize }: { batchSize: number }
): Promise<PromiseSettledResult<T>[]> {
    const results: PromiseSettledResult<T>[] = [];
    let nextBatch = takeNextN(batchSize, promises);
    while (nextBatch.length > 0) {
        results.push(...(await Promise.allSettled(nextBatch)));
        nextBatch = takeNextN(batchSize, promises);
    }
    return results;
}
export async function settlePromisesInBatches<T>(
    promises: T[],
    { batchSize }: { batchSize: number }
): Promise<PromiseSettledResult<T>[]> {
    return settlePromisesInBatchesByIterator(promises[Symbol.iterator](), { batchSize });
}

function takeNextN<T>(n: number, iterator: Iterator<T, T, T>): T[] {
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
