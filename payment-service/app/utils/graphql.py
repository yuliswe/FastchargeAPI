from gql import Client
from gql.transport.requests import RequestsHTTPTransport
# from . import signing
import os

from aws_requests_auth.boto_utils import BotoAWSRequestsAuth

auth = BotoAWSRequestsAuth(
    aws_host="api.iam.graphql.fastchargeapi.com",
    aws_region="us-east-1",
    aws_service="execute-api",
)

graphql_service = "https://api.iam.graphql.fastchargeapi.com"

if os.environ.get("LOCAL_GRAPHQL") == "1":
    graphql_service = "http://host.docker.internal:4000"
    auth = None


def get_graphql_client() -> Client:
    transport = RequestsHTTPTransport(
        url=graphql_service,
        headers={
            # "Authorization": signing.get_payment_service_idtoken(),
            "X-User-Email": "payment-service@fastcharge-api.com",
            "Content-Type": "application/json",
            "X-Service-Name": "payment",
        },
        auth=auth,
    )
    return Client(transport=transport, fetch_schema_from_transport=True)
