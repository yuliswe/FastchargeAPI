import chalk from "chalk";
import { Command, program } from "commander";
import opener from "opener";
import { graphql } from "src/__generated__/gql";
import { envVars, reactHost } from "src/env";
import { getGQLClient } from "src/graphqlClient";
import { NotFoundSimpleGQLError } from "src/simplifiedGQLErrors";
import { tiChecker } from "src/tiChecker";
import { CliCommonLoginCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { createSecretPair, getRemoteSecret } from "src/utils/remoteSecret";
import * as uuid from "uuid";
import { readOrRefreshAuthFile, verifyIdToken, writeToAuthFile } from "../utils/authFile";

export const createCommonLoginCommand = () =>
  new Command("login")
    .summary("Login as a user")
    .description("Stores the user credentials in the system.")
    .helpOption("--help", "Display help for command")
    .option("--profile <char>", "Store the user credentials in a profile")
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
    if (auth) {
      console.log(profile ? `Login successful for profile '${profile}'.` : "Login successful.");
      if (envVars.SHOW_AUTH) {
        console.log(auth);
      }
      return auth;
    }
  } catch (e) {
    // ignore error and proceed to login
  }

  const key = uuid.v4();
  const { jweSecret, jwtSecret } = createSecretPair();
  const hex = (arr: Uint8Array) =>
    Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const params = new URLSearchParams({
    relogin: "true",
    behavior: "putsecret",
    jwe: hex(jweSecret),
    jwt: hex(jwtSecret),
    key,
  });
  const url = new URL(`/auth/?${params.toString()}`, reactHost);
  opener(url.href);
  console.log(chalk.yellow("Please authenticate in the browser."));
  console.log("If the browser does not open, please visit:");
  console.log(chalk.blue(url.href));

  let idToken = "";
  let refreshToken = "";
  let tries = 0;
  while (tries < 120) {
    await new Promise((r) => setTimeout(r, 1000));
    tries += 1;
    try {
      const value = await getRemoteSecret({ key, jweSecret, jwtSecret });
      ({ idToken, refreshToken } = tiChecker.RefreshIdTokenResult.from(value));
      break;
    } catch (e) {
      if (e instanceof NotFoundSimpleGQLError) {
        if (tries >= 40) {
          console.log("Timed out. Press enter to retry.");
          await new Promise((r) => setTimeout(r, 3000));
        }
        continue;
      }
      throw e;
    }
  }
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

  console.log(chalk.green("Login successful."));
  return authFileContent;
};
