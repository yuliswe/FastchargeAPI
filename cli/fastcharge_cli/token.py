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
        print(f'Error generating app user token: {str(e)}')
        return None
