from dataclasses import dataclass

import click
import colorama
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup

from .__generated__ import gql_operations as GQL
from .context_obj import ContextObject
from .exceptions import AlreadyExists, ImmutableResource, NotFound, PermissionDenied
from .fastcharge_app import get_app_or_prompt_exit
from .graphql_client import get_client_info
from .groups import fastcharge

terminal = Terminal()


@dataclass
class PricingInfo:
    pk: str
    name: str
    callToAction: str
    minMonthlyCharge: str
    chargePerRequest: str


@fastcharge.group("pricing", cls=ClickAliasedGroup)
@click.help_option("-h", "--help")
def fastcharge_dev_pricing():
    """Manage pricing for an existing app"""


@fastcharge_dev_pricing.command("list", aliases=["ls"])
@click.argument("app_name", required=True)
@click.help_option("-h", "--help")
@click.pass_obj
def pricing_list(ctx_obj: ContextObject, app_name: str):
    """List pricing plans for [APP]."""
    client, auth = get_client_info(ctx_obj.profile)
    if get_app_or_prompt_exit(client, app_name) is None:
        return
    app = GQL.list_app_pricing_details(client, app_name=app_name)
    echo(terminal.blue + terminal.bold + f"app: {app.name}" + terminal.normal)
    if app.pricingPlans:
        echo(terminal.bold + " Available plans:" + terminal.normal)
    else:
        echo(colorama.Style.RESET_ALL + " No pricing plans available.")
        exit(0)
    for plan in app.pricingPlans:
        echo(colorama.Style.RESET_ALL, nl=False)
        echo(terminal.green(f"  name: {plan.name}"))
        echo(terminal.bold(f"  id: {plan.pk}"))
        echo(f"  ${float(plan.minMonthlyCharge):.2f} during active month", nl=False)
        echo(f" + additional ${plan.chargePerRequest} per request")
        echo(f"  First {plan.freeQuota} requests are free of charge.")
        if plan.callToAction:
            echo(terminal.dim(f"  {plan.callToAction}"))
        echo()


@fastcharge_dev_pricing.command("add")
@click.argument("app_name", required=True)
@click.option("-n", "--name", help="Name of the pricing plan.", required=True)
@click.option(
    "-m",
    "--monthly-charge",
    type=float,
    help="Active monthly charge.",
    required=True,
)
@click.option(
    "-r", "--charge-per-request", type=float, help="Charge per request.", required=True
)
@click.option("-c", "--call-to-action", help="Call to action for the pricing plan.")
@click.option(
    "--make-visible",
    type=bool,
    default=False,
    is_flag=True,
    help="Make the pricing plan visible and start accepting subscriptions.",
)
@click.option(
    "-f",
    "--free-quota",
    type=int,
    required=True,
    help="Provide free quota to subscribers.",
)
@click.help_option("-h", "--help")
@click.pass_obj
def pricing_add(
    ctx_obj: ContextObject,
    app_name: str,
    name: str,
    call_to_action: str,
    monthly_charge: float,
    charge_per_request: float,
    make_visible: bool,
    free_quota: int,
):
    """Add a pricing plan to an existing app."""
    if make_visible:
        warn_visibility_change(
            min_monthly_charge=monthly_charge,
            charge_per_request=charge_per_request,
            free_quota=free_quota,
        )
    client, auth = get_client_info(ctx_obj.profile)
    try:
        result = GQL.create_app_pricing_plan(
            client,
            app=app_name,
            name=name,
            callToAction=call_to_action,
            minMonthlyCharge=str(monthly_charge),
            chargePerRequest=str(charge_per_request),
            visible=make_visible,
            freeQuota=free_quota,
        )
        echo(terminal.green + "Pricing plan added successfully." + terminal.normal)
    except AlreadyExists:
        echo(
            colorama.Fore.RED
            + f"Pricing plan '{name}' already exists for app '{app_name}'."
        )
        echo(
            colorama.Fore.YELLOW
            + f"Run fastcharge pricing ls --app {app_name} to view the plan."
        )
        echo(colorama.Style.RESET_ALL, nl=False)
        return


@fastcharge_dev_pricing.command("update", aliases=["up"])
@click.argument("pricing_id", required=True)
@click.option("-n", "--name", help="Name of the pricing plan.")
@click.option("-m", "--monthly-charge", type=float, help="Minimum monthly charge.")
@click.option("-r", "--charge-per-request", type=float, help="Charge per request.")
@click.option("-c", "--call-to-action", help="Call to action for the pricing plan.")
@click.option(
    "--make-visible",
    type=bool,
    is_flag=True,
    help="Make the pricing plan visible and start accepting subscriptions.",
)
@click.option("-f", "--free-quota", type=int, help="Provide free quota to subscribers.")
@click.help_option("-h", "--help")
@click.pass_obj
def pricing_update(
    ctx_obj: ContextObject,
    pricing_id: str,
    name: str,
    call_to_action: str,
    monthly_charge: str,
    charge_per_request: str,
    make_visible: bool,
    free_quota: int,
):
    """Update an existing pricing plan given its ID."""
    client, auth = get_client_info(ctx_obj.profile)
    try:
        GQL.update_app_pricing_plan(
            client,
            pk=pricing_id,
            name=name,
            callToAction=call_to_action,
            minMonthlyCharge=monthly_charge and str(monthly_charge),
            chargePerRequest=charge_per_request and str(charge_per_request),
            freeQuota=free_quota,
        )
    except NotFound:
        echo(terminal.red(f"Pricing plan with ID '{pricing_id}' does not exist."))
        exit(1)
    except PermissionDenied:
        echo(terminal.red(f"You do not have permission to update this pricing object."))
        exit(1)
    except ImmutableResource:
        echo(
            terminal.red(
                f"You cannot update this pricing plan's monthly charge, per-request charge, and free quota, as it is already visible and accepting subscriptions."
            )
        )
        exit(1)

    if make_visible:
        result = GQL.get_pricing_detail(client, pk=pricing_id)
        warn_visibility_change(
            min_monthly_charge=float(result.minMonthlyCharge),
            charge_per_request=float(result.chargePerRequest),
            free_quota=int(result.freeQuota),
        )
        GQL.update_app_pricing_plan(
            client,
            pk=pricing_id,
            visible=make_visible,
        )


def warn_visibility_change(
    min_monthly_charge: float, charge_per_request: float, free_quota: int
):
    echo(
        "Warning: You are about to make the pricing plan visible and start accepting subscriptions."
    )
    echo(
        terminal.yellow(
            "After making the pricing plan visible, you can no longer modify the monthly charge, per-request charge, free quota, or delete the pricing plan, even if you make it invisible again."
        )
    )
    echo("Confirm the pricing before continuing:")
    echo(f"  Minimum monthly charge: ${min_monthly_charge}")
    echo(f"  Charge per request: ${charge_per_request}")
    echo(f"  Free quota: {free_quota}")
    if not click.confirm("Do you want to continue?"):
        exit(0)
