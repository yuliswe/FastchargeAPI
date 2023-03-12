import click

from .account import do_account_topup

from .groups import fastapi
from click_aliases import ClickAliasedGroup
from blessings import Terminal

terminal = Terminal()


@fastapi.group("account", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastapi_account():
    """Manage your account."""
    pass


@fastapi_account.command("topup")
@click.help_option("-h", "--help")
@click.argument("amount", type=float, required=True)
def fastapi_account_topup(amount: float):
    """Top up your FastchargeAPI account.

    Amount in USD.
    """
    do_account_topup(amount)
