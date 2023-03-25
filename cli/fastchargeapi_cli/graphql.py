from dataclasses import dataclass
from functools import cache
import json
from typing import Optional
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from gql.transport.exceptions import TransportQueryError
from .auth_file import AuthFileContent, read_or_refresh_auth_file
from .exceptions import (
    AlreadyExists,
    ImmutableResource,
    NotFound,
    TooManyResources,
    PermissionDenied,
    BadUserInput,
)
from click import echo
from .config import graphql_host


class GQLClient:
    def __init__(
        self, *, id_token: Optional[str] = None, user_email: Optional[str] = None
    ):
        transport = AIOHTTPTransport(
            graphql_host,
            headers={
                "Authorization": id_token or "",
                "X-User-Email": user_email or "",
            },
        )
        self.client = Client(transport=transport, fetch_schema_from_transport=False)
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
            elif ext_code == "PERMISSION_DENIED":
                raise PermissionDenied(str(e))
            elif ext_code == "IMMUTABLE_RESOURCE":
                raise ImmutableResource(str(e))
            elif ext_code == "BAD_USER_INPUT":
                raise BadUserInput(str(e))
            else:
                raise e


def gql_execute(client, model, variables):
    result = client.execute(gql(model.Meta.document), variable_values=variables)
    return model(**result)


@dataclass
class User:
    email: str
    pk: str


@cache
def get_client_info() -> tuple[GQLClient, AuthFileContent]:
    """This function returns a tuple of (client, user_email). Is it root
    function that identifies the user for the cli."""
    auth = read_or_refresh_auth_file()

    if auth is None:
        echo("You must be logged in.")
        exit(1)

    return GQLClient(id_token=auth.id_token, user_email=auth.email), auth
