import chalk from "chalk";
import { Command } from "commander";
import opener from "opener";
import { reactHost } from "src/env";
import { tiChecker } from "src/tiChecker";
import { CliCommonAddMoneyCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { createCommand } from "src/utils/command";
import { println } from "src/utils/console";
import { hex, waitForSecretContent } from "src/utils/remoteSecret";

export const createCommonAddMoneyCommand = (program: Command) =>
  createCommand({
    name: "addmoney",
    summary: "Add money to your account",
    description: "Top up your account balance for API usage.",
  })
    .requiredOption("--amount <number>", "Pay amount in USD.", parseFloat)
    .action(async (options) => {
      await addMoneyCommand({
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliCommonAddMoneyCommandOptions.strictFrom(options),
      });
    });

async function addMoneyCommand(args: { globalOptions: CliGlobalOptions; options: CliCommonAddMoneyCommandOptions }) {
  const { options } = args;
  const { amount } = options;
  const value = await waitForSecretContent({
    timeoutSeconds: 10 * 60,
    sendSecrets(args) {
      const { jweSecret, jwtSecret, key } = args;
      const params = new URLSearchParams({
        amount: amount.toString(),
        key,
        jwe: hex(jweSecret),
        jwt: hex(jwtSecret),
      });
      const url = new URL(`/topup?${params.toString()}`, reactHost);
      opener(url.href);
      println(chalk.yellow("Please continue in the browser."));
      println("If the browser does not open, please visit:");
      println(chalk.blue(url.href));
    },
  });
  const { status } = tiChecker.CliRemoteSercretResult.strictFrom(value);
  if (status === "success") {
    println(chalk.green("Money added to account."));
  }
  if (status === "canceled") {
    println(chalk.red("Canceled."));
    process.exit(1);
  }
}