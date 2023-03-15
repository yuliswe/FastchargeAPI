from dataclasses import dataclass
import textwrap
from .remote_secret import interact_with_react

from .graphql import get_client_info
from click import echo
from . import config
from blessings import Terminal
import webbrowser
from gql import gql

terminal = Terminal()


def do_account_topup(amount: float):
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

    account_balance = get_account_balance()
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

    client, user_email = get_client_info()

    query, result = interact_with_react(
        poll_max_count=10,
        poll_max_reached_prompt="Press enter after completing in browser.",
    )
    location = f"{config.react_host}/topup?amount={amount}&" + query.url_query_secrets
    webbrowser.open_new(location)
    echo("Please complete payment in browser:")
    echo(terminal.blue + " " + location + terminal.normal)
    result = result.read()  # block

    if result["status"] == "success":
        echo(terminal.green + "Payment successful." + terminal.normal)
    elif result["status"] == "canceled":
        echo(terminal.red + "Payment canceled." + terminal.normal)


@dataclass
class GetUserAccountResult:
    balance: str
    balanceLimit: str


def get_account_balance() -> GetUserAccountResult:
    client, user_email = get_client_info()
    user = client.execute(
        gql(
            """
            query GetUserAccount($user_email: Email!) {
                user(email: $user_email) {
                    balance
                    balanceLimit
                }
            }
            """
        ),
        variable_values={"user_email": user_email},
    )["user"]
    return GetUserAccountResult(**user)


def do_account_info():
    client, user_email = get_client_info()
    echo(f"Account: {user_email}")
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
    # login_link = "https://connect.stripe.com/app/express"
    login_link = "https://connect.stripe.com/express_login"
    if user["stripeConnectAccountId"]:
        echo(
            terminal.green
            + terminal.bold
            + f"Stripe account is active."
            + terminal.normal
        )
        echo(f" Login to Stripe to view your account:")
        echo(terminal.cyan + f"  {login_link}" + terminal.normal)
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


def do_account_update(author: str):
    client, user_email = get_client_info()
    user = client.execute(
        gql(
            """
            query UpdateUserInfo($email: Email!, $author: String!) {
                user(email: $email) {
                    updateUser(author: $author) {
                        updatedAt
                    }
                }
            }
            """
        ),
        variable_values={
            "email": user_email,
            "author": author,
        },
    )
