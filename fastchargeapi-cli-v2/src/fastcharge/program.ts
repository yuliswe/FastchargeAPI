import { Command } from "commander";
import { createCommonLoginCommand } from "src/common/login";
import { createCommonLogoutCommand } from "src/common/logout";
import { createFastchargeAppCreateCommand } from "src/fastcharge/app/create";
import { createFastchargeAppListCommand } from "src/fastcharge/app/list";
import { print } from "src/utils/console";

export const createFastchargeProgram = () => {
  const program = new Command("fastcharge");
  return program
    .version("0.0.1")
    .configureOutput({
      writeErr: print,
      writeOut: print,
    })
    .description("fastcharge cli")
    .usage("[global-options] command")
    .helpOption("--help", "Display help for command")
    .addHelpCommand(false)
    .option("--profile <name>", "run command as a specific user")
    .addCommand(createCommonLoginCommand(program))
    .addCommand(createCommonLogoutCommand(program))
    .addCommand(createFastchargeAppCommand(program));
};
export const createFastchargeAppCommand = (program: Command) =>
  new Command("app")
    .addHelpCommand(false)
    .addCommand(createFastchargeAppListCommand(program))
    .addCommand(createFastchargeAppCreateCommand(program));
