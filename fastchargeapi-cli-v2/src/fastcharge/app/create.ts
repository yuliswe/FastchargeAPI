import { ValidationError } from "@/src/errors";
import { validateAppName } from "@/src/functions/app";
import chalk from "chalk";
import { Command } from "commander";
import { graphql } from "src/__generated__/gql";
import { reactHost } from "src/env";
import { AlreadyExistsSimpleGQLError } from "src/simplifiedGQLErrors";
import { tiChecker } from "src/tiChecker";
import { CliFastchargeAppCreateCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { readOrRefreshAuthFileContentOrExit } from "src/utils/authFile";
import { createCommand } from "src/utils/command";
import { println } from "src/utils/console";
import { getAuthorizedGQLClient } from "src/utils/graphqlClient";

export const createFastchargeAppCreateCommand = (program: Command) =>
  createCommand({
    name: "create",
    summary: "Create your app",
    description: "Create a new app",
  })
    .requiredOption("--name <name>", "Name of the app", parseAppName)
    .option("--title <title>", "Title of the app, defaults to name")
    .action(async (options) => {
      await appCreateCommand({
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliFastchargeAppCreateCommandOptions.strictFrom(options),
      });
    });

async function appCreateCommand(args: {
  globalOptions: CliGlobalOptions;
  options: CliFastchargeAppCreateCommandOptions;
}) {
  const { options, globalOptions } = args;
  const { profile } = globalOptions;
  const { userPK } = await readOrRefreshAuthFileContentOrExit({ profile });
  const client = await getAuthorizedGQLClient({ profile });
  try {
    const result = await client.mutate({
      mutation: graphql(`
        mutation CreateApp(
          $name: String!
          $owner: ID!
          $title: String
          $gatewayMode: GatewayMode = proxy
          $description: String
          $repository: URL
          $homepage: URL
          $visibility: AppVisibility = public
          $logo: URL
        ) {
          createApp(
            name: $name
            owner: $owner
            title: $title
            gatewayMode: $gatewayMode
            description: $description
            repository: $repository
            homepage: $homepage
            visibility: $visibility
            logo: $logo
          ) {
            pk
            name
          }
        }
      `),
      variables: { ...options, owner: userPK },
    });
    const { pk, name } = result.data.createApp;
    println(`App created: ${name}`);
    println(chalk.blue(` ${reactHost}/app/${pk}`));
  } catch (e) {
    if (e instanceof AlreadyExistsSimpleGQLError) {
      println(`An app with this name already exists: ${options.name}.`);
      println("Please use a different name.");
      process.exit(1);
    }
    throw e;
  }
}

const parseAppName = (name: string) => {
  try {
    validateAppName(name);
    return name;
  } catch (e) {
    if (e instanceof ValidationError) {
      if (e.field === "name") {
        println(`Invalid app name "${name}": ${e.validationErrorMessage}.`);
        println(chalk.yellow(`Please use a different name.`));
      }
      process.exit(1);
    }
    throw e;
  }
};
