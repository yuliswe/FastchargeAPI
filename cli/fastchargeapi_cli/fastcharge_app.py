from typing import Optional
from urllib.parse import urlparse

from blessings import Terminal
from .groups import fastcharge
import click
from .exceptions import BadUserInput, NotFound
from .graphql import get_client_info
from dataclasses import dataclass
import colorama
from click_aliases import ClickAliasedGroup
from click import echo
from .__generated__ import gql_operations as GQL

terminal = Terminal()


@fastcharge.group("app", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_dev_app():
    """Create and manage apps"""
    pass


@fastcharge_dev_app.command("create", aliases=["new"])
@click.argument("name", required=True)
def fastcharge_app_create(name: str):
    """Create a new app with [NAME]."""
    if get_app(name) is not None:
        echo(
            terminal.red
            + terminal.bold
            + f'An app with the name "{name}" has already been registered.\n'
            "Please use a different name." + terminal.normal
        )
        return
    client, auth = get_client_info()
    GQL.create_app(client, name=name, owner=auth.user_pk)
    echo(
        terminal.green
        + terminal.bold
        + f'App "{name}" created successfully.'
        + terminal.normal
    )


@fastcharge_dev_app.command("list", aliases=["ls"])
def fastcharge_app_list():
    """List your apps."""
    client, auth = get_client_info()
    apps = GQL.list_apps_owned_by_user(client, user=auth.user_pk).apps
    for app in apps:
        echo(terminal.blue + terminal.bold + f"{app.name}:" + terminal.normal)
        echo(
            terminal.dim
            + " "
            + (app.description or "No description.")
            + terminal.no_dim
        )
        echo()


@fastcharge_dev_app.command("delete", aliases=["del"])
@click.argument("name", required=True)
def fastcharge_app_delete(name: str):
    """Delete an app with [NAME]."""
    if get_app(name) is None:
        echo(f'An app with the name "{name}" does not exist.')
        return
    delete_app(name)
    echo(f"App {name} deleted.")


@dataclass
class AppInfo:
    name: str
    author: str
    gatewayMode: str
    description: str

    def pretty_print(self):
        echo(terminal.blue + terminal.bold + f"{self.name}:" + terminal.normal)
        echo(
            terminal.dim
            + " "
            + (self.description or "No description.")
            + terminal.no_dim
        )
        echo()


def get_app(name: str) -> Optional[GQL.GetAppDetailApp]:
    client, auth = get_client_info()
    try:
        app = GQL.get_app_detail(client, name=name)
        return app
    except NotFound:
        return None


def delete_app(name: str):
    client, auth = get_client_info()
    result = GQL.delete_app(client, name=name)


def get_app_or_prompt_exit(app_name: str) -> Optional[GQL.GetAppDetailApp]:
    """Get an app by name, or prompt the user it doesn't exist."""
    if (app := get_app(app_name)) is None:
        echo(colorama.Fore.RED + f'An app with the name "{app_name}" does not exist.')
        echo(colorama.Fore.YELLOW + "Run `fastcharge app list` to see all apps.")
        echo(colorama.Fore.YELLOW + "Run `fastcharge app create` to register an app.")
        exit(1)
    else:
        return app


def validate_gateway_mode_or_exit(mode: str):
    if mode not in ["proxy", "redirect"]:
        echo(
            terminal.red
            + terminal.bold
            + f'"{mode}" is not a valid gateway mode. Please use "proxy" or "redirect".'
            + terminal.normal
        )
        exit(1)


class URL(click.ParamType):
    name = "url"

    def convert(self, value, param, ctx):
        if not isinstance(value, tuple):
            url = urlparse(value)
            if url.scheme != "https":
                self.fail(
                    f"invalid URL. Only HTTPS URLs are allowed.",
                    param,
                    ctx,
                )
        return value


@fastcharge_dev_app.command("update", aliases=["up"])
@click.argument("app_name", required=True)
@click.option("--description", help="Description of the app. (100 characters max)")
@click.option(
    "--repository", type=URL(), help="URL to the (Github) repository for the app."
)
@click.option("--homepage", type=URL(), help="URL to the homepage for the app.")
@click.option("--readme", type=URL(), help="URL to the README.md file for the app.")
def fastcharge_app_update(
    app_name: str, description: str, repository: str, homepage: str, readme: str
):
    """Update information for an existing app."""
    client, auth = get_client_info()
    try:
        GQL.update_app(
            client,
            app_name=app_name,
            description=description,
            repository=repository,
            homepage=homepage,
            readme=readme,
        )
    except NotFound:
        echo(
            terminal.red
            + terminal.bold
            + f'An app with the name "{app_name}" does not exist.'
            + terminal.normal
        )
        echo(terminal.yellow + "Run `fastcharge app list` to see all apps.")
        exit(1)
