import jwt
import requests
from .graphql import get_client_info
from gql import gql
from .groups import fastcharge_client
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup
import click

terminal = Terminal()

@fastcharge_client.group("token", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_token():
    """Generate and manage user tokens."""
    pass


@fastcharge_token.command("create")
@click.option(
    "-a", "--app", "app_name", help="Generates user token for the specified app.", required=True
)
def create_app_user_token(app_name):
    client, email = get_client_info()
    try:
        result = client.execute(
            gql(
                """
                query($name: String!) {
                    app(name: $name) {
                        createAppUserToken
                    }
                }
                """
            ),
            { "name": app_name }
        )
        token = result["app"]["createAppUserToken"]
        print(f'Successfully created user token for App "{app_name}"')
        return token
    except Exception as e:
        print(f'Error creating app user token: {str(e)}')
        return None


@fastcharge_token.command("revoke")
@click.option(
    "-a", "--app", "app_name", help="Revokes user token for the specified app.", required=True
)
def revoke_app_user_token(app_name):
    client, email = get_client_info()
    try:
        result = client.execute(
            gql(
                """
                query($name: String!) {
                    app(name: $name) {
                        revokeAppUserToken
                    }
                }
                """
            ),
            { "name": app_name }
        )
        isTokenFound = result["app"]["revokeAppUserToken"]
        if isTokenFound:
            print(f'Successfully revoked user token for App "{app_name}".')
        else:
            print(f'Token for App "{app_name}" not found.')
    except Exception as e:
        print(f'Error revoking app user token: {str(e)}')
        return None
