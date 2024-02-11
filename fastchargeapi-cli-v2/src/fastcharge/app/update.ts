import { Command } from "commander";
import { graphql } from "src/__generated__/gql";
import { tiChecker } from "src/tiChecker";
import { CliFastchargeAppUpdateCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { getAppPKByPKOrName } from "src/utils/app";
import { createCommand } from "src/utils/command";
import { println } from "src/utils/console";
import { getAuthorizedGQLClient } from "src/utils/graphqlClient";

export const createFastchargeAppUpdateCommand = (program: Command) =>
  createCommand({
    name: "update",
    summary: "Update your app",
    description: "Update your app's information",
  })
    .argument("<id/name>", "App id or name")
    .action(async (appIdOrName: string, options) => {
      await appUpdateCommand({
        appIdOrName,
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliFastchargeAppUpdateCommandOptions.strictFrom(options),
      });
    });

async function appUpdateCommand(args: {
  appIdOrName: string;
  globalOptions: CliGlobalOptions;
  options: CliFastchargeAppUpdateCommandOptions;
}) {
  const {
    appIdOrName,
    globalOptions: { profile },
    options,
  } = args;
  const client = await getAuthorizedGQLClient({ profile });
  const appPK = await getAppPKByPKOrName({ pkOrName: appIdOrName, client });
  const result = await client.mutate({
    mutation: graphql(`
      mutation UpdateAppById(
        $pk: ID!
        $title: String
        $description: String
        $repository: URL
        $homepage: URL
        $visibility: AppVisibility
        $logo: URL
      ) {
        getApp(pk: $pk) {
          updateApp(
            title: $title
            description: $description
            repository: $repository
            homepage: $homepage
            visibility: $visibility
            logo: $logo
          ) {
            pk
          }
        }
      }
    `),
    variables: {
      pk: appPK,
      ...options,
    },
  });
  println(`Updated ${result.data.getApp.updateApp.pk}.`);
}
