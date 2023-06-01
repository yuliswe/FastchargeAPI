import os
import time
import webbrowser
from typing import Optional
from uuid import uuid4

import click
from blessings import Terminal
from click import echo

from . import config
from .auth_file import (
    delete_auth_file,
    list_auth_files,
    query_user_pk,
    read_or_refresh_auth_file,
    verify_id_token,
    write_to_auth_file,
)
from .context_obj import ContextObject
from .exceptions import NotFound
from .graphql_client import GQLClient
from .groups import fastapi, fastcharge
from .remote_secret import get_remote_secret

term = Terminal()


@fastapi.command("login")
@click.argument("profile", required=False)
@click.pass_obj
def fastapi_login(ctx_obj: ContextObject, profile: Optional[str]):
    """Login to your account.

    Optionally, specify a name to save the login as a profile.
    """
    do_login(profile or ctx_obj.profile)


@fastcharge.command("login")
@click.argument("profile", required=False)
@click.pass_obj
def fastcharge_login(ctx_obj: ContextObject, profile: Optional[str]):
    """Login to your account.

    Optionally, specify a name to save the login as a profile.
    """
    do_login(profile or ctx_obj.profile)


def do_login(profile: Optional[str]):
    if auth := read_or_refresh_auth_file(profile):
        if profile is None:
            echo("Login successful.")
        else:
            echo(f"Login successful for profile '{profile}'.")
        if os.environ.get("SHOW_AUTH") == "1":
            echo(auth)
        return auth

    client = GQLClient()  # use an anonymous client to get the secret
    key = uuid4().hex
    jwe_secret = os.urandom(64)  # 512 bits
    jwt_secret = os.urandom(64)  # 512 bits
    url = f"{config.react_host}/auth/?relogin=true&behavior=putsecret&jwe={jwe_secret.hex()}&jwt={jwt_secret.hex()}&key={key}"
    webbrowser.open_new(url)
    echo("Please authenticate in the browser.")
    echo("If the browser does not open, please visit:")
    echo(term.blue(" " + url))
    tries = 0
    while True:
        time.sleep(3)
        tries += 1
        try:
            if value := get_remote_secret(client, key, jwe_secret, jwt_secret):
                id_token, refresh_token = value["idToken"], value["refreshToken"]
                break
        except NotFound as e:
            pass
        if tries > 40:
            input("Timed out. Press enter to retry.")
            continue
    user_email = verify_id_token(id_token)
    assert user_email is not None, "ID token is invalid. Login failed."
    user_pk = query_user_pk(id_token, user_email.email)
    write_to_auth_file(
        profile=profile,
        id_token=id_token,
        refresh_token=refresh_token,
        user_pk=user_pk,
        email=user_email.email,
    )
    auth = read_or_refresh_auth_file(profile)  # poluates user pk and email
    if profile is None:
        echo("Login successful.")
    else:
        echo(f"Login successful for profile '{profile}'.")
    if os.environ.get("SHOW_AUTH") == "1":
        echo(auth)


@fastapi.command("logout")
@click.argument("profile", required=False)
@click.pass_obj
def fastapi_logout(ctx_obj: ContextObject, profile: Optional[str]):
    """Log off your account.

    Optionally specify a profile to log off. If no profile is specified, all
    profiles will be logged off.
    """
    do_logout(profile or ctx_obj.profile)


@fastcharge.command("logout")
@click.argument("profile", required=False)
@click.pass_obj
def fastcharge_logout(ctx_obj: ContextObject, profile: Optional[str]):
    """Log off your account.

    Optionally specify a profile to log off. If no profile is specified, all
    profiles will be logged off.
    """
    do_logout(profile or ctx_obj.profile)


def do_logout(profile: Optional[str] = None):
    if profile:
        delete_auth_file(profile)
    else:
        for file in list_auth_files():
            file.unlink(missing_ok=True)
