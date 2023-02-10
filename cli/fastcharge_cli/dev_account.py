import textwrap
import webbrowser

from blessings import Terminal

from .local_server import LocalServerResponse, start_local_server

from .http import HttpClient
from .dev_app import get_app, get_app_or_prompt_exit
from .graphql import get_client_info
from .groups import fastcharge_dev
import click
from gql import gql
from dataclasses import dataclass
from click import echo
from . import config

terminal = Terminal()


@fastcharge_dev.group("account")
@click.help_option("-h", "--help")
def fastcharge_dev_account():
    """View your account balance and metics."""


@fastcharge_dev_account.command("info")
@click.help_option("-h", "--help")
def fastcharge_dev_account_info():
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
    login_link = get_dashboard_login_link(user_email)
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


@fastcharge_dev_account.command("withdraw")
@click.help_option("-h", "--help")
@click.argument("amount", type=float, required=True)
def fastcharge_account_dev_withdraw(amount: str):
    """Withdraw account balance to your Stripe account."""
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
            + terminal.bold
            + f"Your account only has a balance of ${balance:.2f}. Cannot withdraw ${withdraw:.2f}"
            + terminal.normal
        )
        exit(1)
    if balance < 3:
        echo(
            terminal.red
            + terminal.bold
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
        + terminal.bold
        + f"You are about to withdraw ${withdraw:.2f} from your FastchargeAPI account to your Stripe account."
        + terminal.normal
    )
    echo(terminal.bold + f"Your FastchargeAPI balance currently is: ${balance:.2f}")
    echo()
    echo(
        "Note that it may take up to 1 busines day for the funds to arrive to your Stripe account."
    )
    stripe_charges_percent = 2.9 + 0.25 + 0.5
    stripe_charges_flat = 2 + 0.5 + 0.25
    echo(
        "\n".join(
            textwrap.wrap(
                f"Stripe Express account charges a fee for the transfer, which is ${stripe_charges_flat:.2f} + {stripe_charges_percent:.4f}% of the transferred amout. "
                "As a result, you may recieve less than the transferred amount.",
            )
        )
    )
    stripe_fee = stripe_charges_flat + stripe_charges_percent / 100 * withdraw
    receive_amount = max(0, withdraw - stripe_fee)
    echo()
    echo(
        f"Estimated received amount to your Stripe account: ${receive_amount * 0.9975:.2f}"
    )
    echo(f"Your FastchargeAPI account estimated new balance: ${balance - withdraw:.2f}")
    echo()
    if input("Continue? (y/N)").strip().lower() == "y":
        response = HttpClient(user_email).post(
            "/payout", json={"withdraw_cents": withdraw_cents}
        )
        echo(terminal.green + terminal.bold + "Payout request sent." + terminal.normal)
        login_url = HttpClient(user_email).get("/dashboard-login").json()["location"]
        echo("Login to Stripe to view your payout status:")
        echo(terminal.blue + " " + login_url + terminal.normal)


def get_dashboard_login_link(user_email: str) -> str:
    return HttpClient(user_email).get("/dashboard-login").json()["location"]


@fastcharge_dev_account.command("topup")
@click.help_option("-h", "--help")
@click.argument("amount", type=float, required=True)
def fastcharge_account_topup(amount: float):
    """Top up your FastchargeAPI account.

    Top up your account in USD.
    """
    amount_cents = int(amount * 100)
    client, user_email = get_client_info()
    with start_local_server() as (port, conn):
        response = HttpClient(user_email).post(
            "/checkout",
            json={
                "amount_cents": amount_cents,
                "success_url": f"{config.react_host}/topup?success=true&post_result=http://localhost:{port}",
                "cancel_url": f"{config.react_host}/topup?cancel=true&post_result=http://localhost:{port}",
            },
        )
        data = response.json()
        location = data["location"]
        echo("Please complete payment in browser:")
        echo(terminal.blue + " " + location + terminal.normal)
        webbrowser.open_new(location)
        res: LocalServerResponse = conn.recv()  # blocks until payment is complete
        if res.json["status"] == "success":
            echo(terminal.green + "Payment successful." + terminal.normal)
        elif res.json["status"] == "canceled":
            echo(terminal.red + "Payment canceled." + terminal.normal)


@fastcharge_dev_account.command("connect-stripe")
@click.help_option("-h", "--help")
def fastcharge_account_connect_stripe():
    """Connect your Stripe account to FastchargeAPI."""

    echo("Please complete the onboarding in browser:")
    echo(terminal.blue + " " + f"{config.react_host}/onboard" + terminal.normal)
    webbrowser.open_new(f"{config.react_host}/onboard")
