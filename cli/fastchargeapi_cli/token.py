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
def fastcharge_token():
    """Generate and manage user tokens."""
    pass


@fastcharge_token.command("create", aliases=["new", "add"])
@click.argument("app_name", required=True)
@click.pass_obj
def create_app_user_token(ctx_obj: ContextObject, app_name: str):
    """Create an API token for the specified app."""

    client, auth = get_client_info(ctx_obj.profile)
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


@fastcharge_token.command("revoke", aliases=["rm", "del"])
@click.argument("app_name", required=True)
@click.pass_obj
def revoke_app_user_token(ctx_obj: ContextObject, app_name: str):
    """Revoke the API token for the specified app."""
    client, auth = get_client_info(ctx_obj.profile)
    try:
        response = GQL.delete_user_app_tpken(client, user=auth.user_pk, app=app_name)
        echo(
            terminal.green
            + f'Successfully revoked user token for app "{app_name}".'
            + terminal.normal
        )
    except NotFound:
        echo(terminal.red + f'Token for app "{app_name}" not found.' + terminal.normal)
    except Exception as e:
        print(f"Error revoking app user token: {str(e)}")
        return None
