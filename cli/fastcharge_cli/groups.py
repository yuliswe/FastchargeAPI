import click
from click_aliases import ClickAliasedGroup


@click.group(cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_client():
    pass


@click.group(cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_dev():
    pass
