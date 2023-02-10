from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from . import signing
import os

graphql_service = "https://api.graphql.fastchargeapi.com"

if os.environ.get("LOCAL") == "1":
    graphql_service = "http://host.docker.internal:4000"


def get_graphql_client() -> Client:
    transport = RequestsHTTPTransport(
        url=graphql_service,
        headers={
            "Authorization": signing.get_payment_service_idtoken(),
            "X-User-Email": "payment-service@fastcharge-api.com",
        },
    )
    return Client(transport=transport, fetch_schema_from_transport=True)
