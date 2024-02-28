import chalk from "chalk";
import type { Command } from "commander";
import { Decimal } from "decimal.js";
import { graphql } from "src/__generated__/gql";
import { SiteMetaDataKey } from "src/__generated__/gql/graphql";
import { baseDomain } from "src/env";
import type { GQLClient } from "src/graphqlClient";
import { tiChecker } from "src/tiChecker";
import type { CliCommonWithdrawMoneyCommandOptions, CliGlobalOptions } from "src/types/cliOptions";
import { readOrRefreshAuthFileContentOrExit } from "src/utils/authFile";
import { createCommand } from "src/utils/command";
import { println, readline } from "src/utils/console";
import { getAuthorizedGQLClient } from "src/utils/graphqlClient";
import { renderMoney } from "src/utils/render";

export const createCommonWithdrawMoneyCommand = (program: Command) =>
  createCommand({
    name: "withdraw",
    summary: "Withdraw money from your account",
    description: "Withdraw money from your account balance.",
  })
    .requiredOption("--amount <number>", "Withdraw amount in USD.", parseFloat)
    .option("-y, --yes", "Skip confirmation prompt.")
    .action(async (options) => {
      await withdrawMoneyCommand({
        globalOptions: tiChecker.CliGlobalOptions.strictFrom(program.opts()),
        options: tiChecker.CliCommonWithdrawMoneyCommandOptions.strictFrom(options),
      });
    });

async function withdrawMoneyCommand(args: {
  globalOptions: CliGlobalOptions;
  options: CliCommonWithdrawMoneyCommandOptions;
}) {
  const {
    options,
    globalOptions: { profile },
  } = args;
  const { userPK } = await readOrRefreshAuthFileContentOrExit({ profile });
  const amount = new Decimal(options.amount);
  const client = await getAuthorizedGQLClient({
    profile,
  });
  const getBalanceResult = await client.query({
    query: graphql(`
      query GetUserBalance($userPK: ID!) {
        getUser(pk: $userPK) {
          balance
        }
      }
    `),
    variables: {
      userPK,
    },
  });
  const balance = new Decimal(getBalanceResult.data.getUser.balance);
  if (balance.lessThan(amount)) {
    println(chalk.red("Insufficient funds."));
    println(chalk.yellow(`Your balance is ${renderMoney(balance)}.`));
    process.exit(1);
  }
  const { receivable, totalFee } = await getRecivableAmountForWithdrawal(client, amount);
  if (receivable.lessThanOrEqualTo(0)) {
    println(`Unable to withdraw due to total transfer fee being ${renderMoney(totalFee)}.`);
    println("This means that after paying the transfer fees, the you will not receive any money.");
    process.exit(1);
  }

  println(chalk.yellow(`Withdrawing $${amount.toFixed(2)} from your account.`));
  println(chalk.yellow(`You will receive $${receivable.toFixed(2)} after transfer fees.`));

  if (options.yes === undefined) {
    const ans = await readline("Continue? ([Y]/n) ");
    if (ans.toLowerCase() === "n") {
      println("Cancelled.");
      process.exit(1);
    }
  }

  await client.mutate({
    mutation: graphql(`
      mutation CreateStripeTransfer($receiver: ID!, $withdrawAmount: NonNegativeDecimal!) {
        createStripeTransfer(receiver: $receiver, withdrawAmount: $withdrawAmount) {
          pk
        }
      }
    `),
    variables: {
      receiver: userPK,
      withdrawAmount: amount.toFixed(2),
    },
  });

  println(chalk.green("Request sent."));
  println(`Note that it may take up to 1 business day for the money to arrive.`);
  println("Login to the account dashboard to track the status of your payout:");
  println(chalk.cyan(`https://${baseDomain}/account`));
}

async function getRecivableAmountForWithdrawal(client: GQLClient, withdrawAmount: Decimal) {
  const result = (await client.query({
    query: graphql(`
      query GetWithdrawFees($stipeFlatFeeKey: String!, $stripePercentageKey: String!) {
        stripeFlatFee: getSiteMetaDataByKey(key: $stipeFlatFeeKey) {
          value
        }
        stripePercentage: getSiteMetaDataByKey(key: $stripePercentageKey) {
          value
        }
      }
    `),
    variables: {
      stipeFlatFeeKey: SiteMetaDataKey.StripeFlatFee,
      stripePercentageKey: SiteMetaDataKey.StripePercentageFee,
    },
  })) as {
    data: {
      stripeFlatFee: { value: string };
      stripePercentage: { value: string };
    };
  };

  const stripeFlatFee = new Decimal(result.data.stripeFlatFee.value);
  const stripeFeePercentage = new Decimal(result.data.stripePercentage.value);

  const totalFee = stripeFlatFee.add(withdrawAmount.mul(stripeFeePercentage));
  const receivable = withdrawAmount.minus(totalFee);

  return { receivable, totalFee };
}
