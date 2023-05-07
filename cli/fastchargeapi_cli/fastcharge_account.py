import textwrap

import click
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup

from . import config
from .__generated__ import gql_operations as GQL
from .account import do_account_info, do_account_topup, do_account_update
from .context_obj import ContextObject
from .graphql_client import get_client_info
from .groups import fastcharge
from .http import HttpClient

terminal = Terminal()


@fastcharge.group("account", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_account():
    """View your account balance and metics"""


@fastcharge_account.command("update", aliases=["up"])
@click.help_option("-h", "--help")
@click.option("--author")
@click.pass_obj
def fastcharge_account_update(ctx_obj: ContextObject, author: str):
    """Update account information."""
    do_account_update(ctx_obj, author)


@fastcharge_account.command("info")
@click.help_option("-h", "--help")
@click.pass_obj
def fastcharge_account_info(ctx_obj: ContextObject):
    """Show account information."""
    do_account_info(ctx_obj)


@fastcharge_account.command("withdraw")
@click.help_option("-h", "--help")
@click.argument("amount", type=float, required=True)
@click.option("-y", "--yes", is_flag=True, help="Skip confirmation prompt.")
@click.pass_obj
def fastcharge_account_withdraw(ctx_obj: ContextObject, amount: str, yes: bool):
    """Withdraw account balance to your Stripe account.

    Amount in USD.
    """
    client, auth = get_client_info(ctx_obj.profile)
    user = GQL.get_user_account_balance_for_withdrawl(client, user=auth.user_pk)
    balance = float(user.balance)
    withdraw = float(amount)
    if withdraw > balance:
        echo(
            terminal.red
            + f"Your account only has a balance of ${balance:.2f}. Cannot withdraw ${withdraw:.2f}"
            + terminal.normal
        )
        exit(1)
    if balance < 3:
        echo(
            terminal.red
            + f"Your account balance is too low to withdraw. The minimum balance is $3."
            + terminal.normal
        )
        exit(1)
    if withdraw < 3:
        echo(
            terminal.red
            + terminal.bold
            + f"Minimum withdrawal amount is $3.00."
            + terminal.normal
        )
        exit(1)
    echo(
        terminal.yellow
        + f"You are about to withdraw ${withdraw:.2f} from your FastchargeAPI account to your Stripe account."
        + terminal.normal
    )
    echo(
        f"Your account has a current balance of: "
        + terminal.green
        + f"${balance:.2f}"
        + terminal.normal
    )
    echo()
    echo(
        "Note that it may take up to 1 busines day for the funds to arrive to your Stripe account."
    )
    stripe_charges_percent = 2.9 + 0.25 + 0.5
    stripe_charges_flat = 2 + 0.5 + 0.25
    echo(
        "\n".join(
            textwrap.wrap(
                f"Stripe Express account charges a fee for the transfer, which is {terminal.blue}${stripe_charges_flat:.2f} + {stripe_charges_percent:.2f}%{terminal.normal} of the transferred amout. "
                "As a result, you may recieve less than the transferred amount.",
            )
        )
    )
    stripe_fee = stripe_charges_flat + stripe_charges_percent / 100 * withdraw
    receive_amount = max(0, withdraw - stripe_fee)
    echo()
    echo(
        "Estimated received amount to your Stripe account: "
        + terminal.yellow
        + f"${receive_amount * 0.9975:.2f}"
        + terminal.normal
    )
    echo(
        "Your FastchargeAPI account estimated new balance: "
        + terminal.green
        + f"${balance - withdraw:.2f}"
        + terminal.normal
    )
    echo()
    if yes or input("Continue? (y/N)").strip().lower() == "y":
        response = HttpClient(ctx_obj.profile).post(
            f"{config.payment_service_host}/create-stripe-transfer",
            json={"withdraw": withdraw},
        )
        if response.status_code != 200:
            echo(terminal.red(f"Error: {response.status_code} {response.reason}"))
            echo(response.text)
            exit(1)
        echo(
            terminal.green
            + terminal.bold
            + "Payout request was sent."
            + terminal.normal
        )
        echo("Note that it may take up to 1 business day for the funds to arrive.")
        echo("Login to the account dashboard to view your payout status:")
        echo(terminal.blue + " https://fastchargeapi.com/account" + terminal.normal)


@fastcharge_account.command("topup")
@click.help_option("-h", "--help")
@click.argument("amount", type=float, required=True)
@click.option("--browser/--no-browser", is_flag=True, default=True)
@click.pass_obj
def fastcharge_account_topup(ctx_obj: ContextObject, amount: float, browser: bool):
    """Top up your FastchargeAPI account.

    Amount in USD.
    """
    do_account_topup(ctx_obj, amount, open_browser=browser)
