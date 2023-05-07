from typing import Optional

import click
from click_aliases import ClickAliasedGroup

from .context_obj import ContextObject
from .version import check_version_or_exit


@click.group(cls=ClickAliasedGroup)  # type: ignore
@click.help_option("-h", "--help")
@click.option("-p", "--profile", type=str, required=False)
@click.pass_context
def fastapi(ctx: click.Context, profile: Optional[str]):
    ctx.obj = ContextObject(
        profile=profile,
    )
    check_version_or_exit()


@click.group(cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
@click.option("-p", "--profile", type=str, required=False)
@click.pass_context
def fastcharge(ctx: click.Context, profile: Optional[str] = None):
    ctx.obj = ContextObject(
        profile=profile,
    )
    check_version_or_exit()
