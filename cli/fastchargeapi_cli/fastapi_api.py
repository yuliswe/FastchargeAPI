from blessings import Terminal

from .api import do_api_list
from .groups import fastapi
import click
from click_aliases import ClickAliasedGroup

terminal = Terminal()


@fastapi.group("api", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastapi_api():
    """Manage API endpoints for an existing app"""
    pass


@fastapi_api.command("list", aliases=["ls"])
@click.argument("app_name")
def api_list(app_name: str):
    """List APIs for [APP_NAME]."""
    do_api_list(app_name)
