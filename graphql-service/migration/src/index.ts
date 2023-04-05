import { program } from "commander";
import { exit } from "process";
import readline from "readline";
import { createDefaultContextBatched } from "graphql-service/RequestContext";
import { copyColumn } from "src/copy-column";
import { Batched } from "graphql-service/dynamoose/dataloader";

let Rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
program
    .command("copy-column")
    .description("Copy a column to a new column")
    .argument("<modelName>", "Name of the Model, eg. User")
    .argument("<oldColumn>", "Old column name, eg. email")
    .argument("<newColumn>", "New column name, eg. emailv2")
    .action(async (modelName: string, oldColumn: string, newColumn: string) => {
        const batched = createDefaultContextBatched();
        if (!(modelName in batched)) {
            console.error(`Model ${modelName} not found`);
            exit(1);
        }
        let model = batched[modelName as keyof typeof batched] as Batched<any>;
        await copyColumn(model, oldColumn, newColumn);
    });

program.parse();
