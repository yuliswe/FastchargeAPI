import { Batched } from "graphql-service/dynamoose/dataloader";
import { Item, Model } from "graphql-service/dynamoose/models";

export async function copyColumn<I extends Item>(model: Batched<I>, oldColumn: keyof I, newColumn: keyof I) {
    let all = await model.scan();
    let promises: Promise<I>[] = [];
    let completed = 0;
    for (let item of all) {
        let p = model.update(item, { [newColumn]: item[oldColumn] } as Partial<I>).then(() => {
            completed++;
            console.log(`${completed} / ${all.length}`);
            return item;
        });
        promises.push(p);
    }
    await Promise.all(promises);
}
