import re

import click
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup

from .__generated__ import gql_operations as GQL
from .context_obj import ContextObject
from .exceptions import AlreadyExists, BadUserInput, NotFound, PermissionDenied
from .fastcharge_app import get_app_or_prompt_exit
from .graphql_client import get_client_info
from .groups import fastcharge

terminal = Terminal()


@fastcharge.group("api", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_api():
    """Manage API endpoints for an existing app"""
    pass


def validate_dest_or_exit(dest: str):
    if re.match(r"https?://[^\s]+", dest) is None:
        echo(terminal.red(f"--destination must be a valid URL."))
        echo(terminal.yellow(f" example: --destination https://example.com"))
        exit(1)


def validate_path_or_exit(path: str):
    if re.match(r"/[^\s]*", path) is None:
        echo(terminal.red(f"--path must be a valid URL path starting with /"))
        echo(terminal.yellow(f" example: --path /myendpoint"))
        exit(1)


@fastcharge_api.command("add")
@click.help_option("-h", "--help")
@click.argument("app_name", required=True)
@click.option(
    "-m",
    "--method",
    required=True,
    type=click.Choice(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
    help="Set [METHOD] for the API.",
)
@click.option("-p", "--path", required=True, help="Set [PATH] for the API.")
@click.option(
    "-d",
    "--destination",
    "dest",
    required=True,
    help="Set [DESTINATION] for the API.",
)
@click.option(
    "--description", "descr", help="Add a description that is visble to customers."
)
@click.pass_obj
def api_add(
    ctx_obj: ContextObject,
    app_name: str,
    method: GQL.HTTPMethod,
    path: str,
    dest: str,
    descr: str,
):
    """Add an API endpoint to an app.

    The API will start forwarding user requests:

    \thttps://[APP_NAME].fastchargeapi.com/[PATH] ~> [DESTINATION]
    """
    client, auth = get_client_info(ctx_obj.profile)
    app = get_app_or_prompt_exit(client, app_name)
    if dest is not None:
        validate_dest_or_exit(dest)
    if path is not None:
        validate_path_or_exit(path)
    try:
        GQL.create_endpoint(
            client,
            app=app_name,
            path=path,
            method=method,
            destination=dest,
            description=descr or "",
        )
    except AlreadyExists:
        echo(
            terminal.yellow
            + f"An API endpoint at '{path}' already exists for {app_name}."
            + terminal.normal
        )
        exit(1)
    else:
        echo(
            terminal.green
            + f"Successfully created an API endpoint '{path}' ~> '{dest}'."
            + terminal.normal
        )


@fastcharge_api.command("list", aliases=["ls"])
@click.argument("app_name")
@click.pass_obj
def api_list(ctx_obj: ContextObject, app_name: str):
    """List APIs for [APP_NAME]."""
    client, auth = get_client_info(ctx_obj.profile)
    app = get_app_or_prompt_exit(client, app_name)
    try:
        app = GQL.get_app_endpoints_as_owner(client, app_name)
    except PermissionDenied:
        echo(terminal.red(f'You do not have permission to manage "{app_name}".'))
        echo("To view the endpoints as a customer, use `fastapi api list` instead.")
        exit(1)
    echo(terminal.blue + terminal.bold + f'"{app.name}" endpoints:\n' + terminal.normal)
    # echo(f"\n Gateway mode: {app['gatewayMode']}\n")
    if app.endpoints:
        for endpoint in app.endpoints:
            url = f"https://{app.name}.fastchargeapi.com{endpoint.path}"
            echo(" ID:\t\t" + endpoint.pk)
            echo(" HTTP Method:\t" + endpoint.method)
            echo(" Endpoint:\t" + f"{url} ~> {endpoint.destination}")
            echo(terminal.dim(f" {endpoint.description or 'No description.'}"))
            echo()
    else:
        echo("No API available.")


@fastcharge_api.command("update", aliases=["up"])
@click.help_option("-h", "--help")
@click.argument("api_id", required=True)
@click.option(
    "-m",
    "--method",
    type=click.Choice(
        list(GQL.HTTPMethod.__members__.values()),
    ),
    help="Set [METHOD] for the API.",
)
@click.option("-p", "--path", help="Set a new path.")
@click.option("-d", "--destination", "dest", help="Set a new destination.")
@click.option("--description", "descr", help="Set a new description.")
@click.pass_obj
def api_update(
    ctx_obj: ContextObject,
    api_id: str,
    method: GQL.HTTPMethod,
    path: str,
    dest: str,
    descr: str,
):
    """Update the information of an API.

    eg. fastcharge api update [API_ID] -p /new/path -d https://new-destination.com

    To find the API_IDs, see `fastcharge api list`.
    """
    client, auth = get_client_info(ctx_obj.profile)
    try:
        variable_values = {
            "api_id": api_id,
            "path": path,
            "destination": dest,
            "description": descr,
        }
        variable_values = {k: v for k, v in variable_values.items() if v}
        endpoint = GQL.update_endpoint(
            client,
            endpoint=api_id,
            method=method,
            path=path,
            destination=dest,
            description=descr,
        ).updateEndpoint
    except (NotFound, AlreadyExists) as e:
        if isinstance(e, AlreadyExists):
            echo(terminal.red(f"An API endpoint at '{path}' already exists."))
        elif isinstance(e, NotFound):
            echo(terminal.red(f"API endpoint id '{api_id}' does not exist."))
        echo(terminal.yellow(f"See `fastcharge api list [APP]` for a list of apis."))
        exit(1)
    except PermissionDenied:
        echo(terminal.red(f"You do not have permission to manage this API."))
        exit(1)
    except BadUserInput as e:
        echo(terminal.red(e.message))
        exit(1)
    else:
        echo(
            terminal.green
            + f"Updated the API endpoint '{endpoint.path}'."
            + terminal.normal
        )


@fastcharge_api.command("remove", aliases=["rm"])
@click.help_option("-h", "--help")
@click.argument("api_id", required=True)
@click.pass_obj
def api_remove(ctx_obj: ContextObject, api_id: str):
    """Remove an API.

    eg. fastcharge api remove [api_id]

    To find the api_ids, see `fastcharge api list`.
    """
    client, auth = get_client_info(ctx_obj.profile)
    try:
        result = GQL.delete_enpoint(client, api_id).deleteEndpoint
        echo(
            terminal.green
            + f"Removed the API endpoint '{result.path}'."
            + terminal.normal
        )
    except NotFound as e:
        if e.resource == "Endpoint":
            echo(terminal.red(f"API endpoint id '{api_id}' does not exist."))
            echo(terminal.yellow(f"See `fastcharge api list` for a list of apis."))
            exit(1)
        else:
            raise e
