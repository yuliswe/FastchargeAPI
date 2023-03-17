import click
from click_aliases import ClickAliasedGroup


@click.group(cls=ClickAliasedGroup)  # type: ignore
@click.help_option("-h", "--help")
def fastapi():
    pass


@click.group(cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge():
    pass
