import chalk from "chalk";
import { Command } from "commander";
import { graphql } from "src/__generated__/gql";
import { HttpMethod } from "src/__generated__/gql/graphql";
import {
  AlreadyExistsSimpleGQLError,
  BadUserInputSimpleGQLError,
  NotFoundSimpleGQLError,
  PermissionDeniedSimpleGQLError,
} from "src/simplifiedGQLErrors";
import { tiChecker } from "src/tiChecker";
import { CliGlobalOptions, type CliFastchargeApiAddCommandOptions } from "src/types/cliOptions";
import { createCommand } from "src/utils/command";
import { println } from "src/utils/console";
import { getAuthorizedGQLClient } from "src/utils/graphqlClient";
import { parseEnum } from "src/utils/others";

export const createFastchargeApiAddCommand = (program: Command) =>
  createCommand({
    name: "add",
    summary: "Add an api",
    description: "Add a new api to an app",
  })
    .requiredOption("--app <name> ", "App where the api will be added")
    .requiredOption("-m --method <method>", "HTTP method, eg. GET", parseEnum(HttpMethod))
    .requiredOption("-p --path <path>", "Path, eg. /user/:id")
    .requiredOption("-d --destination <destination>", "Destination")
    .option("--description [description]", "Description")
    .action(async (options) => {
      await apiAddCommand({
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliFastchargeApiAddCommandOptions.strictFrom(options),
      });
    });

async function apiAddCommand(args: { globalOptions: CliGlobalOptions; options: CliFastchargeApiAddCommandOptions }) {
  const {
    options: { app, method, path, destination, description },
    globalOptions: { profile },
  } = args;

  const client = await getAuthorizedGQLClient({ profile });
  try {
    await client.mutate({
      mutation: graphql(`
        mutation CreateApi(
          $app: ID!
          $method: HttpMethod!
          $path: String!
          $destination: String!
          $description: String
        ) {
          createEndpoint(
            app: $app
            method: $method
            path: $path
            destination: $destination
            description: $description
          ) {
            pk
            method
            path
            destination
            description
          }
        }
      `),
      variables: { app, method, path, destination, description },
    });
    println(chalk.green(`Successfully created an API endpoint '${path}' ~> '${destination}'.`));
  } catch (error) {
    if (error instanceof AlreadyExistsSimpleGQLError) {
      println(`Api path "${path}" already exists.`);
      process.exit(1);
    }
    if (error instanceof NotFoundSimpleGQLError && error.resource === "App") {
      println(chalk.red(`${error.resource} "${app}" was not found.`));
      process.exit(1);
    }
    if (error instanceof PermissionDeniedSimpleGQLError) {
      println(chalk.red(`You do not have permission to manage this API.`));
      process.exit(1);
    }
    if (error instanceof BadUserInputSimpleGQLError) {
      println(chalk.red("Invalid argument. Please fix the input and try again."));
      println(chalk.red(error.message));
      process.exit(1);
    }
    println(chalk.red("An error occurred while creating the API."));
    println(chalk.red(JSON.stringify(error)));
    throw error;
  }
}
