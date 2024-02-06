import { Command } from "commander";
import { createCommonLoginCommand } from "src/common/login";
import { createCommonLogoutCommand } from "src/common/logout";

export const createFastchargeProgram = () =>
  new Command("fastcharge")
    .version("0.0.1")
    .description("fastcharge cli")
    .usage("[global-options] command")
    .helpOption("--help", "Display help for command")
    .addHelpCommand(false)
    .option("--profile <char>", "run command as a specific user")
    .addCommand(createCommonLoginCommand())
    .addCommand(createCommonLogoutCommand());
