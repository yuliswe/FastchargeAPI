from blessings import Terminal

from .groups import fastapi
import click
from click_aliases import ClickAliasedGroup

from blessed import Terminal
from .fastcharge_app import get_app_or_prompt_exit
from .graphql import get_client_info
from click import echo
from .__generated__ import gql_operations as GQL

terminal = Terminal()


@fastapi.group("api", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastapi_api():
    """Manage API endpoints for an existing app"""
    pass


@fastapi_api.command("list", aliases=["ls"])
@click.argument("app_name")
def fastapi_api_list(app_name: str):
    """List APIs for [APP_NAME]."""
    client, auth = get_client_info()
    app = get_app_or_prompt_exit(app_name)
    app = GQL.get_app_endpoints(client, app_name)
    echo(terminal.blue + terminal.bold + f'"{app.name}" endpoints:\n' + terminal.normal)
    # echo(f"\n Gateway mode: {app['gatewayMode']}\n")
    if app.endpoints:
        for endpoint in app.endpoints:
            url = f"https://{app.name}.fastchargeapi.com{endpoint.path}"
            echo(" ID:\t\t" + endpoint.pk)
            echo(" Endpoint:\t" + url)
            echo(terminal.dimgray(f" {endpoint.description or 'No description.'}"))
            echo()
    else:
        echo("No API available.")
