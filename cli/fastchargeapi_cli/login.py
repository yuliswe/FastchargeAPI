import time
from uuid import uuid4
import os
import webbrowser

from .remote_secret import get_remote_secret_from_s3
from .groups import fastcharge, fastapi
from . import config
from click import echo
from .auth_file import (
    get_or_refresh_token,
    get_or_refresh_id_token_from_auth_file,
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
    if token := get_or_refresh_id_token_from_auth_file():
        if os.environ.get("SHOW_AUTH") == "1":
            echo(token)
        return token

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
    write_to_auth_file(id_token, refresh_token)
    token = get_or_refresh_token(id_token, refresh_token)
    if os.environ.get("SHOW_AUTH") == "1":
        echo(token)


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
