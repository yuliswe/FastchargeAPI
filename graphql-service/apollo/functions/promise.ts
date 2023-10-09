export async function settlePromisesInBatchesByIterator<Arg, PromiseValue>(
    args: Iterator<Arg, Arg, Arg>,
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
    return settlePromisesInBatchesByIterator(args[Symbol.iterator](), handler, { batchSize });
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
