from blessed import Terminal
from click import echo
from gql import gql

from .graphql import get_client_info
from .exceptions import NotFound

terminal = Terminal()


def validate_app_exists(name: str):
    client, email = get_client_info()
    try:
        app = client.execute(
            gql(
                """
                query GetApp($name: String!) {
                    app(name: $name) {
                        name
                    }
                }
                """
            ),
            {"name": name},
        )["app"]
    except NotFound:
        echo(
            terminal.red
            + terminal.bold
            + f'App does not exist: "{name}"'
            + terminal.normal
        )
        exit(1)
    else:
        return app["name"]
