from datetime import datetime, timedelta
import jwt
import urllib


def get_private_key():
    return """-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIEyeMhHUNphY8qbngDQqL8fj6u4J/3Qw9yrBMBW14lLsoAcGBSuBBAAK
oUQDQgAEff6luY0S65/ZwAAX9Sej+Ju9U1aVRO0QdL3Cc1xYQWwIma6cEPG50Z6W
m1QNmFa60GtCylPyaqPrXMHLlcY6uQ==
-----END EC PRIVATE KEY-----
"""


def get_public_key():
    return """-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEff6luY0S65/ZwAAX9Sej+Ju9U1aVRO0Q
dL3Cc1xYQWwIma6cEPG50Z6Wm1QNmFa60GtCylPyaqPrXMHLlcY6uQ==
-----END PUBLIC KEY-----
"""


def lambda_handler(event, context):
    iat = datetime.utcnow()
    token = jwt.encode(
        {
            "exp": iat - timedelta(seconds=60),
            "iat": iat,
        },
        get_private_key(),
        algorithm="ES256K",
    )
    return {
        "statusCode": 307,
        "body": "",
        "headers": {
            "Location": "https://a541d79ond.execute-api.us-east-1.amazonaws.com/DEV/echo"
            + event["path"]
            + "?"
            + urllib.parse.urlencode(
                {**event["queryStringParameters"], "fastchargeapi_token": token}
            ),
        },
    }
