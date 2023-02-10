import json
from typing import TypedDict
import requests
import jwt
from cryptography.x509 import load_pem_x509_certificate
import diskcache


# def dev_hack_allow_all():
#     return {
#         "principalId": "testuser1.fastchargeapi@gmail.com",
#         "policyDocument": {
#             "Version": "2012-10-17",
#             "Statement": [
#                 {
#                     "Action": "execute-api:Invoke",
#                     "Effect": "Allow",
#                     "Resource": "arn:aws:execute-api:*:*:*",
#                 }
#             ],
#         },
#         "context": {
#             "userEmail": "testuser1.fastchargeapi@gmail.com",
#         },
#     }


def lambda_handler(event, context):
    """
    Input: see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-input.html
    Expects out put: see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html
    """
    # if event["httpMethod"] == "OPTIONS":
    #     return allow_preflight()

    if not (id_token := event.get("authorizationToken", "")):
        return denied()

    if not (user := verify_id_token(id_token)):
        return denied()

    return allowed(user)


def denied():
    return {
        "principalId": "anonymousUser",
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:*",
                    "Effect": "Deny",
                    "Resource": "arn:aws:execute-api:*:*:*",
                }
            ],
        },
        "context": {"anonymousUser": "true"},
    }


# def allow_preflight():
#     return {
#         "principalId": "CORS_PREFLIGHT",
#         "policyDocument": {
#             "Version": "2012-10-17",
#             "Statement": [
#                 {
#                     "Action": "execute-api:Invoke",
#                     "Effect": "Allow",
#                     "Resource": "arn:aws:execute-api:*:*:*",
#                 }
#             ],
#         },
#         "context": {
#             "anonymousUser": "true",
#         },
#     }


def allowed(user):
    return {
        "principalId": user["sub"],
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": "Allow",
                    "Resource": "arn:aws:execute-api:*:*:*",
                }
            ],
        },
        "context": {
            "firebaseUserId": user["sub"],
            "userEmail": user["email"],
            "firebaseUser": json.dumps(user),
            "anonymousUser": "false",
        },
    }


cache = diskcache.Cache("/tmp")


@cache.memoize(expire=3600)
def get_google_cert() -> dict:
    google_cert = requests.get(
        "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    ).json()
    return google_cert


def verify_id_token(id_token: str):
    """Verify the id token. Return the payload if valid, None otherwise."""
    google_cert = get_google_cert()

    try:
        header = jwt.get_unverified_header(id_token)
    except jwt.exceptions.InvalidTokenError as e:
        return None
    if header.get("alg", "") != "RS256":
        return None
    if header.get("kid", "") not in google_cert:
        return None
    google_cert = google_cert.get(header["kid"], "").encode("ASCII")
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
        return None
