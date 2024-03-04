import chalk from "chalk";
import { Command } from "commander";
import { graphql } from "src/__generated__/gql";
import { HttpMethod } from "src/__generated__/gql/graphql";
import { tiChecker } from "src/tiChecker";
import { CliGlobalOptions, type CliFastchargeApiUpdateCommandOptions } from "src/types/cliOptions";
import { createCommand } from "src/utils/command";
import { println } from "src/utils/console";
import { getAuthorizedGQLClient } from "src/utils/graphqlClient";
import { parseEnum } from "src/utils/others";

export const createFastchargeApiUpdateCommand = (program: Command) =>
  createCommand({
    name: "update",
    summary: "Update an api",
    description: "Update an existing api",
  })
    .argument("<id>", "ID of the api to update")
    .option("-m --method <method>", "HTTP method, eg. GET", parseEnum(HttpMethod))
    .option("-p --path <path>", "Path, eg. /user/:id")
    .option("-d --destination <destination>", "Destination")
    .option("--description [description]", "Description")
    .action(async (id: string, options: unknown) => {
      await apiUpdateCommand({
        id,
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliFastchargeApiUpdateCommandOptions.strictFrom(options),
      });
    });

async function apiUpdateCommand(args: {
  id: string;
  globalOptions: CliGlobalOptions;
  options: CliFastchargeApiUpdateCommandOptions;
}) {
  const {
    id,
    options: { method, path, destination, description },
    globalOptions: { profile },
  } = args;

  const client = await getAuthorizedGQLClient({ profile });
  await client.mutate({
    mutation: graphql(`
      mutation UpdateEndpoint(
        $endpoint: ID!
        $method: HttpMethod
        $path: String
        $destination: String
        $description: String
      ) {
        getEndpoint(pk: $endpoint) {
          path
          updateEndpoint(method: $method, path: $path, destination: $destination, description: $description) {
            pk
            path
            description
            destination
          }
        }
      }
    `),
    variables: {
      endpoint: id,
      method,
      path,
      destination,
      description,
    },
  });
  println(chalk.green("API updated."));
}
