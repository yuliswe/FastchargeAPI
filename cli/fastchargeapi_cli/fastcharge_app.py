from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse

import click
import colorama
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup

from .__generated__ import gql_operations as GQL
from .context_obj import ContextObject
from .exceptions import AlreadyExists, NotFound
from .graphql_client import GQLClient, get_client_info
from .groups import fastcharge

terminal = Terminal()


@fastcharge.group("app", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_dev_app():
    """Create and manage apps"""
    pass


@fastcharge_dev_app.command("create", aliases=["new"])
@click.argument("name", required=True)
@click.pass_obj
def fastcharge_app_create(ctx_obj: ContextObject, name: str):
    """Create a new app with [NAME]."""
    client, auth = get_client_info(ctx_obj.profile)
    try:
        GQL.create_app(client, name=name, owner=auth.user_pk)
    except AlreadyExists:
        echo(
            terminal.red
            + terminal.bold
            + f'An app with the name "{name}" has already been registered.\n'
            "Please use a different name." + terminal.normal
        )
    else:
        echo(
            terminal.green
            + terminal.bold
            + f'App "{name}" created successfully.'
            + terminal.normal
        )


@fastcharge_dev_app.command("list", aliases=["ls"])
@click.pass_obj
def fastcharge_app_list(ctx_obj: ContextObject):
    """List your apps."""
    client, auth = get_client_info(ctx_obj.profile)
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
@click.pass_obj
def fastcharge_app_delete(ctx_obj: ContextObject, name: str):
    """Delete an app with [NAME]."""
    client, auth = get_client_info(ctx_obj.profile)
    try:
        result = GQL.delete_app(client, name=name)
    except NotFound:
        echo(f'An app with the name "{name}" does not exist.')
        exit(1)
    else:
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


def get_app_or_prompt_exit(
    client: GQLClient, app_name: str
) -> Optional[GQL.GetAppDetailApp]:
    """Get an app by name, or prompt the user it doesn't exist."""
    try:
        app = GQL.get_app_detail(client, name=app_name)
    except NotFound:
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
@click.option(
    "--make-public/--make-private",
    "visibility",
    is_flag=True,
    help="Set the visibility of the app.",
    default=None,
)
@click.pass_obj
def fastcharge_app_update(
    ctx_obj: ContextObject,
    app_name: str,
    description: str,
    repository: str,
    homepage: str,
    readme: str,
    visibility: Optional[bool] = None,
):
    """Update information for an existing app."""
    client, auth = get_client_info(ctx_obj.profile)
    try:
        GQL.update_app(
            client,
            app_name=app_name,
            description=description,
            repository=repository,
            homepage=homepage,
            readme=readme,
            visibility=(
                None
                if visibility is None
                else GQL.AppVisibility.public
                if visibility
                else GQL.AppVisibility.private
            ),
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
