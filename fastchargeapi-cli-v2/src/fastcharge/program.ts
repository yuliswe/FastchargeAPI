import { Command } from "commander";
import { createCommonPayCommand } from "src/common/account/pay";
import { createCommonLoginCommand } from "src/common/login";
import { createCommonLogoutCommand } from "src/common/logout";
import { createFastchargeAppCreateCommand } from "src/fastcharge/app/create";
import { createFastchargeAppDeleteCommand } from "src/fastcharge/app/delete";
import { createFastchargeAppListCommand } from "src/fastcharge/app/list";
import { createFastchargeAppUpdateCommand } from "src/fastcharge/app/update";
import { createCommand } from "src/utils/command";

export const createFastchargeProgram = () => {
  const program = createCommand({ name: "fastcharge", summary: "fastcharge cli", description: "fastcharge cli" });
  return program
    .version("0.0.1")
    .usage("[global-options] command")
    .option("--profile <name>", "run command as a specific user")
    .addCommand(createCommonLoginCommand(program))
    .addCommand(createCommonLogoutCommand(program))
    .addCommand(createFastchargeAppCommand(program))
    .addCommand(createFastchargeAccountCommand(program));
};

const createFastchargeAppCommand = (program: Command) =>
  createCommand({ name: "app", summary: "Manage or create your apps", description: "Manage or create your apps" })
    .addCommand(createFastchargeAppListCommand(program))
    .addCommand(createFastchargeAppCreateCommand(program))
    .addCommand(createFastchargeAppUpdateCommand(program))
    .addCommand(createFastchargeAppDeleteCommand(program));

const createFastchargeAccountCommand = (program: Command) =>
  createCommand({ name: "account", summary: "Manage your account", description: "Manage your account" }).addCommand(
    createCommonPayCommand(program)
  );
