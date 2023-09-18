import { Batched } from "@/database/dataloader";
import { Item } from "@/database/models";

export async function copyColumn<I extends Item>(model: Batched<I, any>, oldColumn: keyof I, newColumn: keyof I) {
    let completed = 0;
    let page = 0;
    for await (const items of model.scan()) {
        page += 1;
        const promises: Promise<I>[] = [];
        for (const item of items) {
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
