import { Command } from "commander";
import { createCommonLoginCommand } from "src/common/login";
import { createCommonLogoutCommand } from "src/common/logout";

export const createFastchargeProgram = () => {
  const program = new Command("fastcharge");
  return program
    .version("0.0.1")
    .description("fastcharge cli")
    .usage("[global-options] command")
    .helpOption("--help", "Display help for command")
    .addHelpCommand(false)
    .option("--profile <name>", "run command as a specific user")
    .addCommand(createCommonLoginCommand(program))
    .addCommand(createCommonLogoutCommand(program));
};
