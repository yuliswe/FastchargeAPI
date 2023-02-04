import textwrap
from typing import Optional
import webbrowser

from blessings import Terminal
import urllib
from .app import AppInfo, get_app, get_app_or_prompt_exit
from .graphql import get_client_info
from .group import fastcharge
import click
from gql import gql
import colorama
from dataclasses import dataclass
from click_aliases import ClickAliasedGroup
from .exceptions import AlreadyExists, NotFound
from click import echo
import re

terminal = Terminal()


@fastcharge.group("account")
@click.help_option("-h", "--help")
def fastcharge_account():
    """View your account balance and metics."""


@fastcharge_account.command("info")
@click.help_option("-h", "--help")
def fastcharge_account_info():
    """Show account information."""
    client, user_email = get_client_info()
    user = client.execute(
        gql(
            """
            query GetUserAccount($user_email: Email!) {
                user(email: $user_email) {
                    balance
                    stripeConnectAccountId
                }
            }
            """
        ),
        variable_values={"user_email": user_email},
    )["user"]
    if user["stripeConnectAccountId"]:
        echo(
            terminal.green
            + terminal.bold
            + f"Stripe account is active."
            + terminal.normal
        )
        echo(
            f" Login to Stripe to view your account: https://dashboard.stripe.com/login"
        )
    echo()
    echo(
        terminal.yellow
        + terminal.bold
        + f"Your Fastchage account balance is: ${float(user['balance']):.2f}"
        + terminal.normal
    )
    echo(
        "\n".join(
            textwrap.wrap(
                f"You can either use the balance to pay for API calls that are made by other developers, or withdraw it to your Stripe account.",
                initial_indent=" ",
                subsequent_indent=" ",
            )
        )
    )
    echo()


@fastcharge_account.command("connect-stripe")
@click.help_option("-h", "--help")
def fastcharge_account_connect_stripe():
    """Connect your Stripe account to FastCharge."""
    webbrowser.open_new(f"http://localhost:8000/onboard")
