from typing import Optional

from blessings import Terminal
from .groups import fastcharge_dev
import click
from .exceptions import NotFound
from .graphql import get_client_info
from gql import gql
from dataclasses import dataclass
import colorama
from click_aliases import ClickAliasedGroup
from click import echo

terminal = Terminal()


@fastcharge_dev.group("app", cls=ClickAliasedGroup)
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
    client, email = get_client_info()
    result = client.execute(
        gql(
            """
                mutation ($name: String!, $owner: String!) {
                    createApp(name: $name, owner: $owner) {
                        name
                    }
                }
            """
        ),
        variable_values={
            k: v
            for k, v in {
                "name": name,
                "owner": email,
            }.items()
            if v
        },
    )
    echo(
        terminal.green
        + terminal.bold
        + f'App "{name}" created successfully.'
        + terminal.normal
    )


@fastcharge_dev_app.command("list", aliases=["ls"])
def fastcharge_app_list():
    """List your apps."""
    for app in list_apps():
        app.pretty_print()


@fastcharge_dev_app.command("delete", aliases=["del"])
@click.argument("name", required=True)
def fastcharge_app_delete(name: str):
    """Delete an app with [NAME]."""
    if get_app(name) is None:
        echo(f'An app with the name "{name}" does not exist.')
        return
    delete_app(name)
    echo(colorama.Fore.CYAN + name, end="")
    echo(colorama.Style.RESET_ALL + " deleted.")


@dataclass
class AppInfo:
    name: str
    author: str
    gatewayMode: str
    owned_by_you: bool
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


def list_apps() -> list[AppInfo]:
    client, email = get_client_info()
    apps = client.execute(
        gql(
            """
            query GetUserAndApps($email: Email!) {
                user(email: $email) {
                    apps {
                        name,
                        gatewayMode,
                        description,
                        owner {
                            author
                        },
                        ownedByYou
                    }
                }
            }
            """
        ),
        variable_values={"email": email},
    )["user"]["apps"]
    return [
        AppInfo(
            name=app["name"],
            gatewayMode=app["gatewayMode"],
            author=app["owner"]["author"],
            owned_by_you=app["ownedByYou"],
            description=app["description"],
        )
        for app in apps
    ]


def get_app(name: str) -> Optional[AppInfo]:
    client, email = get_client_info()
    try:
        app = client.execute(
            gql(
                """
                query GetApp($name: String!) {
                    app(name: $name) {
                        name,
                        description,
                        gatewayMode,
                        owner {
                            author
                        },
                        ownedByYou
                    }
                }
                """
            ),
            {"name": name},
        )["app"]
        return AppInfo(
            name=app["name"],
            gatewayMode=app["gatewayMode"],
            author=app["owner"]["author"],
            owned_by_you=app["ownedByYou"],
            description=app["description"],
        )
    except NotFound:
        return None


def delete_app(name: str):
    client, email = get_client_info()
    result = client.execute(
        gql(
            """
            mutation DeleteApp($name: String!) {
                deleteApp(name: $name) {
                    name
                }
            }
            """
        ),
        {"name": name},
    )


def get_app_or_prompt_exit(app_name: str) -> Optional[AppInfo]:
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


@fastcharge_dev_app.command("update", aliases=["up"])
@click.argument("app_name", required=True)
@click.option("--description", help="Description of the app. (100 characters max)")
@click.option("--repository", help="URL to the (Github) repository for the app.")
@click.option("--homepage", help="URL to the homepage for the app.")
def fastcharge_app_update(
    app_name: str, description: str, repository: str, homepage: str
):
    """Update information for an existing app."""
    client, email = get_client_info()
    try:
        result = client.execute(
            gql(
                """
                query GetAppAndUpdate($app_name: String!, $description: String, $gateway_mode: GatewayMode, $repository: String, $homepage: String) {
                    app(name: $app_name) {
                        updateApp(description: $description, gatewayMode: $gateway_mode, repository: $repository, homepage: $homepage) {
                            name
                        }
                    }
                }
                """
            ),
            {
                k: v
                for k, v in {
                    "app_name": app_name,
                    "description": description,
                    "repository": repository,
                    "homepage": homepage,
                }.items()
                if v is not None
            },
        )["app"]
    except NotFound:
        echo(
            terminal.red
            + terminal.bold
            + f'An app with the name "{app_name}" does not exist.'
            + terminal.normal
        )
        echo(terminal.yellow + "Run `fastcharge app list` to see all apps.")
        exit(1)
