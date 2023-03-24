import click
from click_aliases import ClickAliasedGroup
from .version import check_version_or_exit
import os


@click.group(cls=ClickAliasedGroup)  # type: ignore
@click.help_option("-h", "--help")
@click.option("-p", "--profile", type=str, required=False)
def fastapi(profile: str):
    if profile:
        os.environ["FAPI_PROFILE"] = profile
    check_version_or_exit()


@click.group(cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
@click.option("-p", "--profile", type=str, required=False)
def fastcharge(profile: str):
    if profile:
        os.environ["FAPI_PROFILE"] = profile
    check_version_or_exit()
