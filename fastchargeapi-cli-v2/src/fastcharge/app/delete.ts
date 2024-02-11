import { Command } from "commander";
import { graphql } from "src/__generated__/gql";
import { NotFoundSimpleGQLError } from "src/simplifiedGQLErrors";
import { tiChecker } from "src/tiChecker";
import { CliFastchargeAppDeleteCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { getAppPKByPKOrName } from "src/utils/app";
import { createCommand } from "src/utils/command";
import { println } from "src/utils/console";
import { getAuthorizedGQLClient } from "src/utils/graphqlClient";

export const createFastchargeAppDeleteCommand = (program: Command) =>
  createCommand({
    name: "delete",
    summary: "Delete your app",
    description: "Delete an existing app",
  })
    .argument("<name/id>", "Name or id of the app to be deleted.")
    .action(async (appNameOrId: string, options) => {
      await appDeleteCommand({
        appNameOrId,
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliFastchargeAppDeleteCommandOptions.strictFrom(options),
      });
    });

async function appDeleteCommand(args: {
  appNameOrId: string;
  globalOptions: CliGlobalOptions;
  options: CliFastchargeAppDeleteCommandOptions;
}) {
  const {
    appNameOrId,
    globalOptions: { profile },
  } = args;
  const client = await getAuthorizedGQLClient({ profile });
  const pk = await getAppPKByPKOrName({
    pkOrName: appNameOrId,
    client,
  }).catch((e) => {
    if (e instanceof NotFoundSimpleGQLError && e.resource === "App") {
      println(`App not found: ${appNameOrId}`);
      process.exit(1);
    }
    throw e;
  });
  const result = await client.mutate({
    mutation: graphql(`
      mutation DeleteApp($pk: ID!) {
        getApp(pk: $pk) {
          deleteApp {
            pk
            name
          }
        }
      }
    `),
    variables: { pk },
  });
  println(`App deleted: ${result.data.getApp.deleteApp.name}`);
}
