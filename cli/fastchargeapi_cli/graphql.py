from functools import cache
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from gql.transport.exceptions import TransportQueryError
from .auth_file import read_auth_file, get_or_refresh_user_from_auth_file
from .exceptions import AlreadyExists, NotFound, TooManyResources
from click import echo
from .config import graphql_host
import os


def make_client(id_token: str, user_email: str) -> Client:
    transport = AIOHTTPTransport(
        graphql_host,
        headers={
            "Authorization": id_token,
            "X-User-Email": user_email,
        },
    )
    return Client(transport=transport, fetch_schema_from_transport=True)


class GQLClient:
    def __init__(self, id_token: str, user_email: str):
        self.client = make_client(id_token, user_email)
        self.user_email = user_email

    def execute(self, *args, **kwargs) -> dict:
        try:
            return self.client.execute(*args, **kwargs)
        except TransportQueryError as e:
            ext_code = e.errors and e.errors[0].get("extensions", {}).get("code")
            if ext_code == "ALREADY_EXISTS":
                raise AlreadyExists(str(e))
            elif ext_code == "NOT_FOUND":
                raise NotFound(str(e))
            elif ext_code == "TOO_MANY_RESOURCES":
                raise TooManyResources(str(e))
            else:
                raise e


@cache
def get_client_info() -> tuple[Client, str]:
    """This function returns a tuple of (client, user_email). Is it root
    function that identifies the user for the cli."""
    if os.environ.get("TEST") == "1":
        email = os.environ.get("USER")
        return GQLClient("", email), email

    user = get_or_refresh_user_from_auth_file()
    if user is None:
        echo("You must be logged in.")
        exit(1)

    auth = read_auth_file()
    return GQLClient(auth["id_token"], user["email"]), user["email"]