import { Command } from "commander";
import fs from "fs/promises";
import { tiChecker } from "src/tiChecker";
import { CliCommonLogoutCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { deleteAuthFile, listAuthFiles } from "src/utils/authFile";
import { createCommand } from "src/utils/command";
import { println } from "src/utils/console";

export const createCommonLogoutCommand = (program: Command) =>
  createCommand({
    name: "logout",
    summary: "Logout a user",
    description: "Clears the user credentials from the system.",
  })
    .option("--profile <name>", "Clear the user credentials for a specific profile")
    .action(async (options) => {
      await logoutCommand({
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliCommonLogoutCommandOptions.strictFrom(options),
      });
    });

export async function logoutCommand(args?: {
  globalOptions: CliGlobalOptions;
  options: CliCommonLogoutCommandOptions;
}) {
  const { globalOptions, options } = args ?? {};
  const profile = globalOptions?.profile ?? options?.profile ?? undefined;
  if (profile) {
    await deleteAuthFile(profile);
  } else {
    for (const file of await listAuthFiles()) {
      await fs.unlink(file);
    }
  }
  println("Logged out.");
}
