import click
from click_aliases import ClickAliasedGroup
from .version import check_version_or_exit


@click.group(cls=ClickAliasedGroup)  # type: ignore
@click.help_option("-h", "--help")
def fastapi():
    check_version_or_exit()


@click.group(cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge():
    check_version_or_exit()
