import textwrap

from blessings import Terminal

from .account import do_account_topup


from .http import HttpClient
from .graphql import get_client_info
from .groups import fastcharge
import click
from gql import gql
from click import echo
from click_aliases import ClickAliasedGroup

terminal = Terminal()


@fastcharge.group("account", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_account():
    """View your account balance and metics"""


@fastcharge_account.command("update", aliases=["up"])
@click.help_option("-h", "--help")
@click.option("--author")
def fastcharge_account_update(author: str):
    """Update account information."""
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


@fastcharge_account.command("info")
@click.help_option("-h", "--help")
def fastcharge_account_info():
    """Show account information."""
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


@fastcharge_account.command("withdraw")
@click.help_option("-h", "--help")
@click.argument("amount", type=float, required=True)
def fastcharge_account_withdraw(amount: str):
    """Withdraw account balance to your Stripe account.

    Amount in USD.
    """
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
    balance = float(user["balance"])
    withdraw = float(amount)
    withdraw_cents = int(withdraw * 100)
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
    if input("Continue? (y/N)").strip().lower() == "y":
        response = HttpClient().post(
            "https://api.v2.payment.fastchargeapi.com/create-stripe-transfer",
            json={"withdrawCents": withdraw_cents},
        )
        if response.status_code != 200:
            echo(
                terminal.red
                + f"Error: {response.status_code} {response.reason}"
                + terminal.normal
            )
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
def fastcharge_account_topup(amount: float):
    """Top up your FastchargeAPI account.

    Amount in USD.
    """
    do_account_topup(amount)
