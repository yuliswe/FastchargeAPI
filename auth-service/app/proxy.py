import json
import requests
import jwt
from cryptography.x509 import load_pem_x509_certificate
import base64

"""
This service first verifies user's identity with 3rd party sign-in services
(e.g. Google, Facebook, etc.). Then it forwards the users request to the backend
service, with the user's identity. The backend service which can be bindly
trusting should only accept requests from this service.

This gateway is capable of handling JSON respones, including GraphQL.
"""


def forward_request(
    upstream: str, event: dict, user_payload: dict
) -> requests.Response:
    headers = event["headers"]
    headers.update(
        {
            "Host": upstream.split("/")[0],
            "X-User": base64.b64encode(json.dumps(user_payload).encode("ASCII")),
        }
    )
    return requests.request(
        method=event["httpMethod"],
        url=f"https://{upstream}{event['path']}",
        params=event["queryStringParameters"],
        data=event["body"],
        headers=headers,
    )


def user_authenticated(event: dict):
    id_token = event["headers"].get("Authorization", "")

    if not id_token:
        return None

    # TODO: cache the response
    google_keys = requests.get(
        "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    ).json()

    header = jwt.get_unverified_header(id_token)
    if header.get("alg", "") != "RS256":
        return None
    if header.get("kid", "") not in google_keys:
        return None
    google_cert = google_keys.get(header["kid"], "").encode("ASCII")
    if not google_cert:
        return None

    cert_obj = load_pem_x509_certificate(google_cert)
    public_key = cert_obj.public_key()

    try:
        payload = jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience="fastchargeapi",
        )
        return payload
    except jwt.exceptions.InvalidTokenError as e:
        print(e)
        return None


def lambda_handler(event, context):
    user = user_authenticated(event)
    if user is None:
        return {
            "statusCode": 401,
            "body": json.dumps({"message": "Unauthorized"}),
        }

    response = forward_request(
        "a541d79ond.execute-api.us-east-1.amazonaws.com/DEV", event, user
    )

    return {
        "statusCode": response.status_code,
        "body": response.text,
    }
