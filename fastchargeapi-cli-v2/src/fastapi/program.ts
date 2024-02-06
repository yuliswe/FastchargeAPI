import { Command } from "commander";
import { createCommonLoginCommand } from "src/common/login";
import { createCommonLogoutCommand } from "src/common/logout";

export const createFastapiProgram = () =>
  new Command("fastapi")
    .option("--profile <char>", "Run command as a specific user")
    .usage("[global-options] command")
    .version("0.0.1")
    .description("fastapi cli")
    .addHelpCommand(false)
    .helpOption("--help", "Display help for command")
    .addCommand(createCommonLoginCommand())
    .addCommand(createCommonLogoutCommand());
