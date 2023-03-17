from dataclasses import dataclass
import dataclasses
from typing import Optional
import requests
from pathlib import Path
import json
import jwt
from cryptography.x509 import load_pem_x509_certificate
from gql import gql
from . import config
from functools import cache


@cache
def get_google_cert() -> dict:
    google_cert = requests.get(
        "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    ).json()
    return google_cert


auth_file_path = Path.home() / ".fastcharge/auth.json"


@dataclass
class AuthFileContent:
    id_token: str
    refresh_token: str
    user_pk: str
    email: str


def write_to_auth_file(
    *,
    id_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
    user_pk: Optional[str] = None,
    email: Optional[str] = None,
) -> AuthFileContent:
    auth_file_path.parent.mkdir(exist_ok=True)
    auth_file = _read_auth_file()
    data = dataclasses.asdict(auth_file) if auth_file else {}
    data.update(
        {
            k: v
            for k, v in {
                "id_token": id_token,
                "refresh_token": refresh_token,
                "user_pk": user_pk,
                "email": email,
            }.items()
            if v is not None
        }
    )
    auth_file_path.write_text(json.dumps(data))
    auth_file_path.chmod(0o600)
    return AuthFileContent(**data)


def read_or_refresh_auth_file(
    force_refresh=False,
) -> Optional[AuthFileContent]:
    """
    Get the id token from the auth file. If the file doesn't exist, return None.
    If the id token is invalid, refresh it and return the new id token. If
    unable to refresh, return None.

    The new id token and refresh token are written to the auth file.
    """
    if auth := _read_auth_file():
        if user := verify_or_refresh_id_token(
            auth.id_token, auth.refresh_token, force_refresh
        ):
            if user.refreshed:
                return write_to_auth_file(
                    id_token=user.id_token,
                    refresh_token=user.refresh_token,
                    email=user.email,
                    user_pk=query_user_pk(user.id_token, user.email),
                )
            else:
                return auth
    return None


def _read_auth_file() -> Optional[AuthFileContent]:
    """Read the decoded id token from the auth file. If the file doesn't exist,
    return None."""
    auth_file = Path.home() / ".fastcharge/auth.json"
    if auth_file.exists():
        auth = json.loads(auth_file.read_text())
        return AuthFileContent(**auth)
    else:
        return None


def query_user_pk(id_token: str, email: str) -> str:
    from .graphql import GQLClient
    from .__generated__ import gql_operations as GQL

    client = GQLClient(id_token=id_token, user_email=email)
    user = GQL.get_user_by_email(client, email=email)
    return user.pk


@dataclass
class VerifyOrRefreshIdTokenResult:
    refreshed: bool
    id_token: str
    refresh_token: str
    email: str


def verify_or_refresh_id_token(
    id_token: str, refresh_token: str, force_refresh=False
) -> Optional[VerifyOrRefreshIdTokenResult]:
    """
    Get user object from the id token. Refresh the id token if necessary.
    """
    if force_refresh:
        result = _refresh_id_token(refresh_token)
        if user := verify_id_token(result.id_token):
            return VerifyOrRefreshIdTokenResult(
                email=user.email,
                id_token=result.id_token,
                refresh_token=result.refresh_token,
                refreshed=True,
            )
        else:
            return None
    elif user := verify_id_token(id_token):
        return VerifyOrRefreshIdTokenResult(
            email=user.email,
            id_token=id_token,
            refresh_token=refresh_token,
            refreshed=False,
        )
    else:
        result = _refresh_id_token(refresh_token)
        user = verify_id_token(result.id_token)
        assert user is not None, "Unable to refresh id token."
        return VerifyOrRefreshIdTokenResult(
            email=user.email,
            id_token=result.id_token,
            refresh_token=result.refresh_token,
            refreshed=True,
        )


@dataclass
class RefreshIdTokenResult:
    id_token: str
    refresh_token: str


def _refresh_id_token(
    refresh_token: str,
) -> RefreshIdTokenResult:
    resp = requests.post(
        f"{config.auth_service_host}/refresh-idtoken",
        json={"refreshToken": refresh_token},
    )
    data = resp.json()
    return RefreshIdTokenResult(
        id_token=data["idToken"], refresh_token=data["refreshToken"]
    )


@dataclass
class VerifyIdTokenResult:
    email: str


def verify_id_token(id_token: str) -> Optional[VerifyIdTokenResult]:
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
            public_key,  # type: ignore
            algorithms=["RS256"],
            audience="fastchargeapi",
        )
        return VerifyIdTokenResult(email=payload["email"])
    except jwt.exceptions.InvalidTokenError as e:
        return None


# def get_or_refresh_token(id_token: str, refresh_token: str) -> RefreshIdTokenResult:
#     """Verifies the id token. Refresh the id token if necessary."""
#     if verify_id_token(id_token) is None:
#         result = _refresh_id_token(refresh_token)
#         write_to_auth_file(id_token=result.id_token, refresh_token=result.refresh_token)
#         return result
#     else:
#         return RefreshIdTokenResult(id_token=id_token, refresh_token=refresh_token)


# def get_or_refresh_id_token_from_auth_file() -> Optional[str]:
#     """Get the id token from the auth file. If the file doesn't exist, return
#     None. If the id token is invalid, refresh it and return the new id token. If
#     unable to refresh, return None."""
#     if auth := _read_auth_file():
#         if token := get_or_refresh_token(auth.id_token, auth.refresh_token):
#             return token.id_token
#     return None
