import chalk from "chalk";
import { Command } from "commander";
import opener from "opener";
import { graphql } from "src/__generated__/gql";
import { envVars, reactHost } from "src/env";
import { getGQLClient } from "src/graphqlClient";
import { tiChecker } from "src/tiChecker";
import { CliCommonLoginCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { readOrRefreshAuthFile, verifyIdToken, writeToAuthFile } from "src/utils/authFile";
import { createCommand } from "src/utils/command";
import { println } from "src/utils/console";
import { hex, waitForSecretContent } from "src/utils/remoteSecret";

export const createCommonLoginCommand = (program: Command) =>
  createCommand({
    name: "login",
    summary: "Login as a user",
    description: "Stores the user credentials in the system.",
  })
    .option("--profile <name>", "Store the user credentials in a profile")
    .action(async (options) => {
      await loginCommand({
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliCommonLoginCommandOptions.strictFrom(options),
      });
    });

export const loginCommand = async (args?: {
  globalOptions?: CliGlobalOptions;
  options?: CliCommonLoginCommandOptions;
}) => {
  const { globalOptions, options } = args ?? {};
  const profile = globalOptions?.profile ?? options?.profile ?? undefined;
  try {
    const auth = await readOrRefreshAuthFile({ profile });
    println(profile ? `Login successful for profile '${profile}'.` : "Login successful.");
    if (envVars.SHOW_AUTH) {
      console.log(auth);
    }
    return auth;
  } catch (e) {
    // ignore error and proceed to login
  }

  const value = await waitForSecretContent({
    timeoutSeconds: 60 * 3,
    sendSecrets: (args) => {
      const { jweSecret, jwtSecret, key } = args;
      const params = new URLSearchParams({
        relogin: "true",
        behavior: "putsecret",
        key,
        jwe: hex(jweSecret),
        jwt: hex(jwtSecret),
      });
      const url = new URL(`/auth/?${params.toString()}`, reactHost);
      opener(url.href);
      println(chalk.yellow("Please authenticate in the browser."));
      println("If the browser does not open, please visit:");
      println(chalk.blue(url.href));
    },
  });

  const { idToken, refreshToken } = tiChecker.RefreshIdTokenResult.from(value);
  const { email } = await verifyIdToken(idToken);
  if (!email) {
    throw new Error("ID token is invalid. Login failed.");
  }
  const resp = await getGQLClient({ email, idToken }).query({
    query: graphql(`
      query GetUserPKByEmail($email: Email!) {
        getUserByEmail(email: $email) {
          pk
        }
      }
    `),
    variables: { email },
  });
  const userPK = resp.data.getUserByEmail.pk;
  const authFileContent = await writeToAuthFile(profile, { idToken, refreshToken, userPK, email });
  if (envVars.SHOW_AUTH) {
    const auth = await readOrRefreshAuthFile({ profile }); // populates user pk and email
    console.log(profile ? `Login successful for profile '${profile}'.` : "Login successful.");
    console.log(auth);
  }

  println(chalk.green("Login successful."));
  return authFileContent;
};
