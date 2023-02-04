from typing import Optional
import requests
from pathlib import Path
import os
import webbrowser
import flask
from multiprocessing.connection import Listener
import json
import jwt
from cryptography.x509 import load_pem_x509_certificate
from .group import fastcharge
from . import login_server
from pathos.multiprocessing import ProcessPool
import diskcache
from click import echo

cache = diskcache.Cache("/tmp")


@cache.memoize(expire=3600)
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


@fastcharge.command("login")
def fastcharge_login():
    """Login to your account on cli,"""
    if user := read_user_from_auth_file():
        echo(user)
        return user

    callback_port = 15128
    socket_port = 15129
    webbrowser.open_new(
        f"http://localhost:8000/auth?relogin=true&behavior=redirect_and_close&redirect=http://localhost:{callback_port}"
    )
    os.environ["FASTCHARGE_SOCKET_PORT"] = str(socket_port)
    with ProcessPool(1) as pool:
        pool.apipe(login_server.app.run, host="localhost", port=callback_port)
        echo("Please authenticate in the browser.")
        conn = Listener(("localhost", socket_port)).accept()
        req: flask.request = conn.recv()
        pool.terminate()
    id_token, refresh_token = req["json"]["idToken"], req["json"]["refreshToken"]
    write_to_auth_file(id_token, refresh_token)
    user = get_user_or_refresh(id_token, refresh_token)

    echo(user)
    return user


@fastcharge.command("logout")
def fastcharge_logout():
    """Log off your account on cli,"""
    auth_file_path.unlink(missing_ok=True)


def read_user_from_auth_file() -> Optional[dict[str, str]]:
    """Get the id token from the auth file. If the file doesn't exist, return
    None. If the id token is invalid, refresh it and return the new id token. If
    unable to refresh, return None."""
    if auth := read_auth_file():
        if user := get_user_or_refresh(auth["id_token"], auth["refresh_token"]):
            return user
    return None


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


def refresh_id_token(refresh_token: str) -> str:
    API_KEY = "AIzaSyAtSOzX-i3gzBYULHltD4Xkz-H9_9U6tD8"
    resp = requests.post(
        f"https://securetoken.googleapis.com/v1/token?key={API_KEY}",
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
    )
    return resp.json()["id_token"]


def get_user_or_refresh(id_token: str, refresh_token: str):
    """Get user object. Refresh the id token if necessary."""
    if user := verify_id_token(id_token):
        return user
    new_id_token = refresh_id_token(refresh_token)
    user = verify_id_token(new_id_token)
    assert user is not None, "Unable to refresh id token."
    write_to_auth_file(new_id_token, refresh_token)
    return user


def get_token_or_refresh(id_token: str, refresh_token: str):
    """Get user object. Refresh the id token if necessary."""
    if user := verify_id_token(id_token):
        return id_token
    else:
        new_id_token = refresh_id_token(refresh_token)
        write_to_auth_file(new_id_token, refresh_token)
        return new_id_token


if __name__ == "__main__":
    fastcharge()
