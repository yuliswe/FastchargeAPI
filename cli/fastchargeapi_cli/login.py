import os
import time
import webbrowser
from typing import Optional
from uuid import uuid4

import click
from click import echo

from . import config
from .auth_file import (
    list_auth_files,
    query_user_pk,
    read_or_refresh_auth_file,
    verify_id_token,
    write_to_auth_file,
)
from .context_obj import ContextObject
from .graphql_client import get_client_info
from .groups import fastapi, fastcharge
from .remote_secret import get_remote_secret_from_s3


@fastapi.command("login")
@click.pass_obj
def fastcharge_client_login(ctx_obj: ContextObject):
    """Login to your account."""
    do_login(ctx_obj)


@fastcharge.command("login")
@click.pass_obj
def fastcharge_dev_login(ctx_obj: ContextObject):
    """Login to your account."""
    do_login(ctx_obj)


def do_login(ctx_obj: ContextObject):
    if auth := read_or_refresh_auth_file(ctx_obj.profile):
        echo("Login successful.")
        if os.environ.get("SHOW_AUTH") == "1":
            echo(auth)
        return auth

    client, user = get_client_info(ctx_obj.profile)
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
        if value := get_remote_secret_from_s3(client, key, jwe_secret, jwt_secret):
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
    auth = read_or_refresh_auth_file(ctx_obj.profile)  # poluates user pk and email
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
    for file in list_auth_files():
        file.unlink(missing_ok=True)
