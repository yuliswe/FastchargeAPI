from typing import Optional

from click import echo
from gql import Client, gql
from gql.transport.aiohttp import AIOHTTPTransport
from gql.transport.exceptions import TransportQueryError

from .auth_file import AuthFileContent, read_or_refresh_auth_file
from .config import graphql_host
from .exceptions import (
    AlreadyExists,
    BadUserInput,
    ImmutableResource,
    NotFound,
    PermissionDenied,
    TooManyResources,
)


class GQLClient(Client):
    def __init__(
        self,
        *,
        id_token: Optional[str] = None,
        user_email: Optional[str] = None,
        user_pk: Optional[str] = None,
    ):
        transport = AIOHTTPTransport(
            graphql_host,
            headers={
                "Authorization": id_token or "anonymous",
                "X-User-Email": user_email or "",
                "X-User-PK": user_pk or "",
            },
        )
        self.client = Client(transport=transport, fetch_schema_from_transport=False)
        self.user_email = user_email
        self.user_pk = user_pk

    def execute(self, *args, **kwargs) -> dict:
        try:
            return self.client.execute(*args, **kwargs)
        except TransportQueryError as e:
            ext: dict = e.errors and e.errors[0].get("extensions", {})  # type: ignore
            msg: str = e.errors and e.errors[0].get("message", str(e))  # type: ignore
            if not ext:
                raise e
            code = ext.get("code")
            if code == "ALREADY_EXISTS":
                raise AlreadyExists(msg)
            elif code == "NOT_FOUND":
                resource = ext.get("resource", "")
                query = ext.get("query", {})
                raise NotFound(msg, resource, query)
            elif code == "TOO_MANY_RESOURCES":
                raise TooManyResources(msg)
            elif code == "PERMISSION_DENIED":
                raise PermissionDenied(msg)
            elif code == "IMMUTABLE_RESOURCE":
                raise ImmutableResource(msg)
            elif code == "BAD_USER_INPUT":
                detail_code = ext.get("detailCode")
                raise BadUserInput(msg, detail_code)
            else:
                raise e


def gql_execute(client, model, variables):
    result = client.execute(gql(model.Meta.document), variable_values=variables)
    return model(**result)


def get_client_info(profile: Optional[str]) -> tuple[GQLClient, AuthFileContent]:
    """This function returns a tuple of (client, user_email). Is it root
    function that identifies the user for the cli."""
    auth = read_or_refresh_auth_file(profile)

    if auth is None:
        echo(f"You must be logged in.")
        exit(1)

    return (
        GQLClient(id_token=auth.id_token, user_email=auth.email, user_pk=auth.user_pk),
        auth,
    )
