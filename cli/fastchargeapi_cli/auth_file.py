from dataclasses import dataclass
from typing import Optional
import requests
from pathlib import Path
import json
import jwt
from cryptography.x509 import load_pem_x509_certificate

from . import config
from functools import cache


@cache
def get_google_cert() -> dict:
    google_cert = requests.get(
        "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    ).json()
    return google_cert


auth_file_path = Path.home() / ".fastcharge/auth.json"


def write_to_auth_file(id_token: str, refresh_token: str):
    auth_file_path.parent.mkdir(exist_ok=True)
    auth_file_path.write_text(
        json.dumps({"refresh_token": refresh_token, "id_token": id_token})
    )
    auth_file_path.chmod(0o600)


def read_auth_file() -> Optional[dict[str, str]]:
    """Read the decoded id token from the auth file. If the file doesn't exist,
    return None."""
    auth_file = Path.home() / ".fastcharge/auth.json"
    if auth_file.exists():
        auth = json.loads(auth_file.read_text())
        return auth
    else:
        return None


def get_or_refresh_user_from_auth_file(force_refresh=False) -> Optional[dict[str, str]]:
    """Get the id token from the auth file. If the file doesn't exist, return
    None. If the id token is invalid, refresh it and return the new id token. If
    unable to refresh, return None."""
    if auth := read_auth_file():
        if user := get_or_refresh_user(
            auth["id_token"], auth["refresh_token"], force_refresh
        ):
            return user
    return None


def get_or_refresh_user(id_token: str, refresh_token: str, force_refresh=False):
    """Get user object from the id token. Refresh the id token if necessary."""
    if force_refresh:
        result = refresh_id_token(refresh_token)
        if user := verify_id_token(result.id_token):
            write_to_auth_file(result.id_token, result.refresh_token)
            return user
        else:
            return None
    elif user := verify_id_token(id_token):
        return user
    else:
        result = refresh_id_token(refresh_token)
        user = verify_id_token(result.id_token)
        assert user is not None, "Unable to refresh id token."
        write_to_auth_file(result.id_token, result.refresh_token)
        return user


@dataclass
class RefreshIdTokenResult:
    id_token: str
    refresh_token: str


def refresh_id_token(
    refresh_token: str,
) -> RefreshIdTokenResult:
    print("refresh_id_token")
    resp = requests.post(
        f"{config.auth_service_host}/refresh-idtoken",
        json={"refreshToken": refresh_token},
    )
    data = resp.json()
    return RefreshIdTokenResult(
        id_token=data["idToken"], refresh_token=data["refreshToken"]
    )


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


def get_token_or_refresh(id_token: str, refresh_token: str):
    """Verifies the id token. Refresh the id token if necessary."""
    if verify_id_token(id_token) is None:
        new_id_token = refresh_id_token(refresh_token)
        write_to_auth_file(new_id_token, refresh_token)
        return new_id_token
    else:
        return id_token


def get_or_refresh_id_token_from_auth_file() -> Optional[str]:
    """Get the id token from the auth file. If the file doesn't exist, return
    None. If the id token is invalid, refresh it and return the new id token. If
    unable to refresh, return None."""
    if auth := read_auth_file():
        if token := get_token_or_refresh(auth["id_token"], auth["refresh_token"]):
            return token
    return None
