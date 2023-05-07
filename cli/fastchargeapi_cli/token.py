import click
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup

from .__generated__ import gql_operations as GQL
from .context_obj import ContextObject
from .exceptions import NotFound, TooManyResources
from .graphql_client import get_client_info
from .groups import fastapi

terminal = Terminal()


@fastapi.group("token", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastapi_token():
    """Generate and manage user tokens."""
    pass


@fastapi_token.command("create", aliases=[])
@click.argument("app_name", required=True)
@click.pass_obj
def create_app_user_token(ctx_obj: ContextObject, app_name: str):
    """Create an API token for the specified app."""

    client, auth = get_client_info(ctx_obj.profile)
    try:
        current_sub = GQL.get_current_subscription(
            client, user=auth.user_pk, app_name=app_name
        )
    except NotFound as e:
        if e.resource == "Subscription":
            echo(terminal.red("You are not subscribed to this app."))
            exit(1)
        else:
            raise e
    try:
        response = GQL.create_user_app_token(client, user=auth.user_pk, app=app_name)
        echo(terminal.green("Token created successfully."))
        echo(terminal.yellow("Save this token! You will not be able to see it again."))
        echo(response.createAppToken.token)
    except NotFound:
        echo(terminal.red + f'App "{app_name}" not found.' + terminal.normal)
        exit(1)
    except TooManyResources:
        echo(
            terminal.red
            + f'A token for app "{app_name}" already exists.'
            + terminal.normal
        )
        exit(1)
    except Exception as e:
        echo(f"Error creating app user token: {str(e)}")


@fastapi_token.command("revoke", aliases=[])
@click.argument("app_name", required=True)
@click.pass_obj
def revoke_app_user_token(ctx_obj: ContextObject, app_name: str):
    """Revoke the API token for the specified app."""
    client, auth = get_client_info(ctx_obj.profile)
    try:
        response = GQL.delete_user_app_tpken(client, user=auth.user_pk, app=app_name)
        echo(terminal.green(f'Token revoked for "{app_name}".'))
    except NotFound as e:
        if e.resource == "App":
            echo(
                terminal.red
                + f'Token for app "{app_name}" not found.'
                + terminal.normal
            )
        else:
            raise e
    except Exception as e:
        echo(terminal.red(f"Error revoking app user token: {str(e)}"))
        return None
