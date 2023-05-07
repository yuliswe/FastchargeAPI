import click
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup

from .__generated__ import gql_operations as GQL
from .context_obj import ContextObject
from .fastcharge_app import get_app_or_prompt_exit
from .graphql_client import get_client_info
from .groups import fastapi

terminal = Terminal()


@fastapi.group("api", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastapi_api():
    """Manage API endpoints for an existing app"""
    pass


@fastapi_api.command("list", aliases=["ls"])
@click.argument("app_name")
@click.pass_obj
def fastapi_api_list(ctx_obj: ContextObject, app_name: str):
    """List APIs for [APP_NAME]."""
    client, auth = get_client_info(ctx_obj.profile)
    app = get_app_or_prompt_exit(client, app_name)
    app = GQL.get_app_endpoints(client, app_name)
    echo(terminal.blue + terminal.bold + f'"{app.name}" endpoints:\n' + terminal.normal)
    # echo(f"\n Gateway mode: {app['gatewayMode']}\n")
    if app.endpoints:
        for endpoint in app.endpoints:
            url = f"https://{app.name}.fastchargeapi.com{endpoint.path}"
            echo(" ID:\t\t" + endpoint.pk)
            echo(" HTTP Method:\t" + endpoint.method)
            echo(" Endpoint:\t" + url)
            echo(terminal.dim(f" {endpoint.description or 'No description.'}"))
            echo()
    else:
        echo("No API available.")
