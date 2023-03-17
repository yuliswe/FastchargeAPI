from blessings import Terminal

from .api import do_api_list
from .fastcharge_app import get_app_or_prompt_exit
from .graphql import get_client_info
from .groups import fastcharge
import click
from click_aliases import ClickAliasedGroup
from .exceptions import AlreadyExists, NotFound
from click import echo
import re
from .__generated__ import gql_operations as GQL

terminal = Terminal()


@fastcharge.group("api", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_dev_api():
    """Manage API endpoints for an existing app"""
    pass


def validate_dest_or_exit(dest: str):
    if re.match(r"https?://[^\s]+", dest) is None:
        echo(terminal.red + f"--destination must be a valid URL." + terminal.normal)
        echo(
            terminal.yellow
            + f" example: --destination https://example.com"
            + terminal.normal
        )
        exit(1)


def validate_path_or_exit(path: str):
    if re.match(r"/[^\s]*", path) is None:
        echo(
            terminal.red
            + f"--path must be a valid URL path starting with /"
            + terminal.normal
        )
        echo(terminal.yellow + f" example: --path /myendpoint" + terminal.normal)
        exit(1)


@fastcharge_dev_api.command("add")
@click.help_option("-h", "--help")
@click.option(
    "-a",
    "--app",
    "app_name",
    required=True,
    help="Add the API to the app with [APP_NAME].",
)
@click.option(
    "-m",
    "--method",
    required=True,
    type=click.Choice(
        ["ANY", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
    ),
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
def api_add(app_name: str, method: GQL.HTTPMethod, path: str, dest: str, descr: str):
    """Add an API endpoint to an app.

    The API will start forwarding user requests:

    \thttps://[APP_NAME].fastchargeapi.com/[PATH] ~> [DESTINATION]
    """
    client, auth = get_client_info()
    app = get_app_or_prompt_exit(app_name)
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


@fastcharge_dev_api.command("list", aliases=["ls"])
@click.argument("app_name")
def api_list(app_name: str):
    """List APIs for [APP_NAME]."""
    do_api_list(app_name)


@fastcharge_dev_api.command("update", aliases=["up"])
@click.help_option("-h", "--help")
@click.argument("api_id", required=True)
@click.option("-p", "--path", help="Set a new path.")
@click.option("-d", "--destination", "dest", help="Set a new destination.")
@click.option("--description", "descr", help="Set a new description.")
def api_update(api_id: str, path: str, dest: str, descr: str):
    """Update the information of an API.

    eg. fastcharge api update [API_ID] -p /new/path -d https://new-destination.com

    To find the API_IDs, see `fastcharge api list`.
    """
    client, auth = get_client_info()
    try:
        variable_values = {
            "api_id": api_id,
            "path": path,
            "destination": dest,
            "description": descr,
        }
        variable_values = {k: v for k, v in variable_values.items() if v}
        endpoint = GQL.update_endpoint(client, api_id, **variable_values).updateEndpoint
    except (NotFound, AlreadyExists) as e:
        if isinstance(e, AlreadyExists):
            echo(
                terminal.red
                + f"An API endpoint at '{path}' already exists."
                + terminal.normal
            )
        elif isinstance(e, NotFound):
            echo(
                terminal.red
                + f"API endpoint id '{api_id}' does not exist."
                + terminal.normal
            )
        echo(
            terminal.yellow
            + f"See `fastcharge api list` for a list of apis."
            + terminal.normal
        )
        exit(1)
    else:
        echo(
            terminal.green
            + f"Updated the API endpoint '{endpoint.path}'."
            + terminal.normal
        )


@fastcharge_dev_api.command("delete", aliases=["del"])
@click.help_option("-h", "--help")
@click.argument("api_id", required=True)
def api_delete(api_id: str):
    """Delete an API.

    eg. fastcharge api delete [api_id]

    To find the api_ids, see `fastcharge api list`.
    """
    client, auth = get_client_info()
    try:
        result = GQL.delete_enpoint(client, api_id).deleteEndpoint
        echo(
            terminal.green
            + f"Deleted the API endpoint '{result.path}'."
            + terminal.normal
        )
    except NotFound:
        echo(
            terminal.red
            + f"API endpoint id '{api_id}' does not exist."
            + terminal.normal
        )
        echo(
            terminal.yellow
            + f"See `fastcharge api list` for a list of apis."
            + terminal.normal
        )
        exit(1)
