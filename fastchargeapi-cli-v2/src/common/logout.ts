import { Command } from "commander";
import fs from "fs/promises";
import { tiChecker } from "src/tiChecker";
import { CliCommonLogoutCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { deleteAuthFile, listAuthFiles } from "../utils/authFile";
import { println } from "src/utils/console";

export const createCommonLogoutCommand = (program: Command) =>
  new Command("logout")
    .summary("Logout a user")
    .description("Clears the user credentials from the system.")
    .helpOption("--help", "Display help for command")
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