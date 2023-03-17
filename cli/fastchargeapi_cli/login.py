import time
from uuid import uuid4
import os
import webbrowser

from .remote_secret import get_remote_secret_from_s3
from .groups import fastcharge, fastapi
from . import config
from click import echo
from .auth_file import (
    query_user_pk,
    read_or_refresh_auth_file,
    verify_id_token,
    write_to_auth_file,
    auth_file_path,
)


@fastapi.command("login")
def fastcharge_client_login():
    """Login to your account."""
    do_login()


@fastcharge.command("login")
def fastcharge_dev_login():
    """Login to your account."""
    do_login()


def do_login():
    if auth := read_or_refresh_auth_file():
        echo("Login successful.")
        if os.environ.get("SHOW_AUTH") == "1":
            echo(auth)
        return auth

    key = uuid4().hex
    jwe_secret = os.urandom(64)  # 512 bits
    jwt_secret = os.urandom(64)  # 512 bits
    webbrowser.open_new(
        f"{config.react_host}/auth?relogin=true&behavior=putsecret&jwe={jwe_secret.hex()}&jwt={jwt_secret.hex()}&key={key}"
    )
    echo("Please authenticate in the browser.")
    tries = 0
    while True:
        time.sleep(5)
        tries += 1
        if value := get_remote_secret_from_s3(key, jwe_secret, jwt_secret):
            id_token, refresh_token = value["idToken"], value["refreshToken"]
            break
        if tries >= 3:
            input("Timed out. Press enter to retry.")
            continue
    user_email = verify_id_token(id_token)
    assert user_email is not None, "ID token is invalid. Login failed."
    user_pk = query_user_pk(id_token, user_email.email)
    write_to_auth_file(
        id_token=id_token,
        refresh_token=refresh_token,
        user_pk=user_pk,
        email=user_email.email,
    )
    auth = read_or_refresh_auth_file()  # poluates user pk and email
    echo("Login successful.")
    if os.environ.get("SHOW_AUTH") == "1":
        echo(auth)


@fastapi.command("logout")
def fastcharge_client_logout():
    """Log off your account."""
    do_logout()


@fastcharge.command("logout")
def fastcharge_dev_logout():
    """Log off your account."""
    do_logout()


def do_logout():
    auth_file_path.unlink(missing_ok=True)
