import click

from .account import do_account_info, do_account_topup, do_account_update

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


@fastapi_account.command("info")
@click.help_option("-h", "--help")
def fastapi_account_info():
    """Show account information."""
    do_account_info()


@fastapi_account.command("update", aliases=["up"])
@click.help_option("-h", "--help")
@click.option("--author")
def fastapi_account_update(author: str):
    """Update account information."""
    do_account_update(author)
