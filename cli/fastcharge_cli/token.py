from ast import alias
import jwt
import requests

from .exceptions import NotFound, TooManyResources
from .graphql import get_client_info
from gql import gql
from .groups import fastapi
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup
import click

terminal = Terminal()


@fastapi.group("token", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_token():
    """Generate and manage user tokens."""
    pass


@fastcharge_token.command("create", aliases=["new", "add"])
@click.argument("app_name", required=True)
def create_app_user_token(app_name):
    """Create an API token for the specified app."""

    client, email = get_client_info()
    try:
        result = client.execute(
            gql(
                """
                query CreateUserAppTpken($user: Email!, $app: ID!) {
                    user(email: $user) {
                        createAppToken(app: $app) {
                            token
                        }
                    }
                }
                """
            ),
            {"app": app_name, "user": email},
        )
        token = result["user"]["createAppToken"]["token"]
        echo(terminal.green("Token created successfully."))
        echo(terminal.yellow("Save this token! You will not be able to see it again."))
        echo(token)
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
def revoke_app_user_token(app_name):
    """Revoke the API token for the specified app."""
    client, email = get_client_info()
    try:
        result = client.execute(
            gql(
                """
                query CreateUserAppTpken($user: Email!, $app: ID!) {
                    user(email: $user) {
                        appToken(app: $app) {
                            deleteUserAppToken {
                                token
                            }
                        }
                    }
                }
                """
            ),
            {"app": app_name, "user": email},
        )
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
