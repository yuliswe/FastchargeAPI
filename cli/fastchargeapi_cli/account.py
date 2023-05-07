import textwrap
import webbrowser
from dataclasses import dataclass
from typing import Optional

from blessings import Terminal
from click import echo
from gql import gql

from . import config
from .__generated__ import gql_operations as GQL
from .context_obj import ContextObject
from .graphql_client import get_client_info
from .remote_secret import interact_with_react

terminal = Terminal()


def do_account_topup(ctx_obj: ContextObject, amount: float, open_browser: bool = False):
    """Top up your FastchargeAPI account.

    Amount in USD.
    """
    amount = int(amount)
    if amount > 100:
        echo(terminal.red + f"Maximum topup amount is $100." + terminal.normal)
        exit(1)
    if amount < 1:
        echo(terminal.red + f"Minimum topup amount is $1." + terminal.normal)
        exit(1)

    client, auth = get_client_info(ctx_obj.profile)
    account_balance = GQL.get_user_account_balance_and_limit(client, user=auth.user_pk)
    if float(account_balance.balance) + amount > float(account_balance.balanceLimit):
        echo(
            terminal.red
            + f"This top-up would make your account exceed its maximum limit of balance."
            + terminal.normal
        )
        echo(
            "For safety reasons, you cannot top up your account to exceed its maximum limit at this time."
        )
        echo(
            f"Your account balance is: {terminal.green}${account_balance.balance}{terminal.normal}"
        )
        echo(
            f"Maximum limit is: {terminal.red}${account_balance.balanceLimit}{terminal.normal}"
        )
        echo("Aborted.")
        exit(1)

    client, user_email = get_client_info(ctx_obj.profile)

    query, result = interact_with_react(
        client=client,
        poll_max_count=10,
        poll_max_reached_prompt="Press enter after completing in browser.",
    )
    location = f"{config.react_host}/topup?amount={amount}&" + query.url_query_secrets
    echo("Please complete payment in browser:")
    echo(" " + terminal.blue(location))

    if open_browser:
        webbrowser.open_new(location)
        result = result.read()  # block
        if result["status"] == "success":
            echo(terminal.green + "Payment successful." + terminal.normal)
        elif result["status"] == "canceled":
            echo(terminal.red + "Payment canceled." + terminal.normal)


def do_account_info(ctx_obj: ContextObject):
    client, auth = get_client_info(ctx_obj.profile)
    user = GQL.get_user_account_info(client, user=auth.user_pk)
    echo(f"Account:\t{user.email}")
    echo(f"Author:\t\t{user.author or '<Not set>'}")
    # login_link = "https://connect.stripe.com/app/express"
    # login_link = "https://connect.stripe.com/express_login"
    # if user["stripeConnectAccountId"]:
    #     echo(
    #         terminal.green
    #         + terminal.bold
    #         + f"Stripe account is active."
    #         + terminal.normal
    #     )
    #     echo(f" Login to Stripe to view your account:")
    #     echo(terminal.cyan + f"  {login_link}" + terminal.normal)
    echo(terminal.yellow(f"Your account balance is: ${float(user.balance):.2f}"))


def do_account_update(ctx_obj: ContextObject, author: Optional[str] = None):
    client, auth = get_client_info(ctx_obj.profile)
    GQL.update_user_info(client, user=auth.user_pk, author=author)
