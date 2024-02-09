import chalk from "chalk";
import { Command } from "commander";
import { graphql } from "src/__generated__/gql";
import { tiChecker } from "src/tiChecker";
import { CliFastchargeAppListCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { readOrRefreshAuthFileContentOrExit } from "src/utils/authFile";
import { println } from "src/utils/console";
import { getAuthorizedGQLClient } from "src/utils/graphqlClient";

export const createFastchargeAppListCommand = (program: Command) =>
  new Command("list")
    .summary("List your apps")
    .aliases(["ls"])
    .description("List your apps")
    .helpOption("--help", "Display help for command")
    .action(async (options) => {
      await appListCommand({
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliFastchargeAppListCommandOptions.strictFrom(options),
      });
    });

async function appListCommand(args: { globalOptions: CliGlobalOptions; options: CliFastchargeAppListCommandOptions }) {
  const { globalOptions } = args;
  const { profile } = globalOptions;
  const { userPK } = await readOrRefreshAuthFileContentOrExit({ profile });
  const client = await getAuthorizedGQLClient({ profile });
  const {
    data: { listAppsByOwner: apps },
  } = await client.query({
    query: graphql(`
      query ListAppsByOwner($owner: ID!) {
        listAppsByOwner(owner: $owner) {
          pk
          name
          description
        }
      }
    `),
    variables: { owner: userPK },
  });
  if (apps.length === 0) {
    println("You don't have any app.");
    return;
  }
  for (const app of apps) {
    const { name, description } = app;
    println(`${chalk.blue(name)}`);
    println(` ${chalk.dim(description ?? "No description")}\n`);
  }
}
