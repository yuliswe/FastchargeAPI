import { Batched } from "graphql-service/database/dataloader";
import { Item } from "graphql-service/database/models";

export async function copyColumn<I extends Item>(model: Batched<I>, oldColumn: keyof I, newColumn: keyof I) {
    let completed = 0;
    let page = 0;
    for await (let items of model.scan()) {
        page += 1;
        const promises: Promise<I>[] = [];
        for (let item of items) {
            const p = model.update(item, { [newColumn]: item[oldColumn] } as Partial<I>).then(() => {
                completed++;
                console.log(`${completed} / ${items.length} on page ${page}`);
                return item;
            });
            promises.push(p);
        }
        await Promise.all(promises);
    }
}
