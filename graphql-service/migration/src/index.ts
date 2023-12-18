import { createDefaultContextBatched } from "@/RequestContext";
import { Batched } from "@/database/dataloader";
import { program } from "commander";
import { exit } from "process";
import { copyColumn } from "./copy-column";

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
    const model = batched[modelName as keyof typeof batched] as Batched<any, any>;
    await copyColumn(model, oldColumn, newColumn);
  });

program.parse();
