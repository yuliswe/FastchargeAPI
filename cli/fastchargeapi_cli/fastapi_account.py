import click
from blessings import Terminal
from click_aliases import ClickAliasedGroup

from .account import do_account_info, do_account_topup, do_account_update
from .context_obj import ContextObject
from .groups import fastapi

terminal = Terminal()


@fastapi.group("account", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastapi_account():
    """Manage your account."""
    pass


@fastapi_account.command("topup")
@click.help_option("-h", "--help")
@click.argument("amount", type=float, required=True)
@click.option("--no-browser", is_flag=True)
@click.pass_obj
def fastapi_account_topup(ctx_obj: ContextObject, amount: float, no_browser: bool):
    """Top up your FastchargeAPI account.

    Amount in USD.
    """
    do_account_topup(ctx_obj, amount, open_browser=not no_browser)


@fastapi_account.command("info")
@click.help_option("-h", "--help")
@click.pass_obj
def fastapi_account_info(ctx_obj: ContextObject):
    """Show account information."""
    do_account_info(ctx_obj)


@fastapi_account.command("update", aliases=["up"])
@click.help_option("-h", "--help")
@click.option("--author")
@click.pass_obj
def fastapi_account_update(ctx_obj: ContextObject, author: str):
    """Update account information."""
    do_account_update(ctx_obj, author)
