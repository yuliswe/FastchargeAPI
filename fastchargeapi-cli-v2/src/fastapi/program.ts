import { Command } from "commander";
import { createCommonLoginCommand } from "src/common/login";
import { createCommonLogoutCommand } from "src/common/logout";
import { print } from "src/utils/console";

export const createFastapiProgram = () => {
  const program = new Command("fastapi");
  return program
    .version("0.0.1")
    .configureOutput({
      writeErr: print,
      writeOut: print,
    })
    .usage("[global-options] command")
    .option("--profile <name>", "Run command as a specific user")
    .description("fastapi cli")
    .addHelpCommand(false)
    .helpOption("--help", "Display help for command")
    .addCommand(createCommonLoginCommand(program))
    .addCommand(createCommonLogoutCommand(program));
};
