import textwrap
import webbrowser

from blessings import Terminal

from .local_server import LocalServerResponse, start_local_server

from .fastcharge_app import get_app, get_app_or_prompt_exit
from .graphql import get_client_info
from .groups import fastcharge
import click
from gql import gql
from dataclasses import dataclass
from click import echo
from . import config

terminal = Terminal()


@fastcharge.group("stripe")
@click.help_option("-h", "--help")
def fastcharge_dev_stripe():
    """Manage your Stripe account"""


@fastcharge_dev_stripe.command("connect")
@click.help_option("-h", "--help")
def fastcharge_dev_stripe_connect():
    """Connect your Stripe account to FastchargeAPI."""

    echo("Please complete the onboarding in browser:")
    echo(terminal.blue + " " + f"{config.react_host}/onboard" + terminal.normal)
    webbrowser.open_new(f"{config.react_host}/onboard")


@fastcharge_dev_stripe.command("dashboard")
@click.help_option("-h", "--help")
def fastcharge_dev_stripe_dashboard():
    """Open your Stripe dashboard."""
    location = "https://connect.stripe.com/express_login"
    echo(terminal.blue + " " + location + terminal.normal)
    webbrowser.open_new(location)
