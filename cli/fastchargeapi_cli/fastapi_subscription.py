from typing import Optional

from blessings import Terminal

from .validate import validate_app_exists

from .graphql import get_client_info
from .groups import fastapi
import click
import colorama
from click_aliases import ClickAliasedGroup
from click import echo
from .exceptions import NotFound
from .__generated__ import gql_operations as GQL

terminal = Terminal()


@fastapi.group("subscription", cls=ClickAliasedGroup, aliases=["sub"])
@click.help_option("-h", "--help")
def fastapi_subscribe():
    """Manage your account subscriptions."""
    pass


@fastapi_subscribe.command("list", aliases=["ls"])
def subscribe_list():
    """List your subscriptions."""
    client, auth = get_client_info()
    subscriptions = GQL.list_all_subscriptions_for_user(
        client, user=auth.user_pk
    ).subscriptions
    echo(terminal.yellow("All apps that you are currently subscribed to:\n"))
    for sub in subscriptions:
        app = sub.app
        pricing = sub.pricing
        echo(
            terminal.blue
            + terminal.bold
            + f'App "{app.name}": \n Current pricing plan "{pricing.name}":'
            + terminal.normal
        )
        echo(
            f"  ${float(pricing.minMonthlyCharge):.2f} monthly subscription",
            nl=False,
        )
        echo(
            f" + additional "
            + f"${float(pricing.chargePerRequest):.2f}".rstrip("0").rstrip(".")
            + " per request"
        )
        echo("  First 1000 requests are free of charge.")
        echo()


@fastapi_subscribe.command("sub", aliases=["add"])
@click.argument("app_name", required=True)
@click.option("-p", "--plan", help="Name of the plan to subscribe to.")
def subscription_add(app_name: str, plan: Optional[str] = None):
    """Subscribe to an app."""
    client, auth = get_client_info()
    validate_app_exists(app_name)
    # Get the pricing plan the user is currently subscribed to, to provide a better output.
    try:
        current_sub = GQL.get_current_subscription(
            client, user=auth.user_pk, app_name=app_name
        )
    except NotFound:
        current_sub = None
    # If no plan is specified, print out the available plans and exit.
    if not plan:
        echo(
            colorama.Fore.YELLOW
            + "To subcribe to a new plan, specify with --plan [NAME]."
            + colorama.Fore.RESET
        )
        # List all the pricing plans for the app, and get the one the user wants to
        # subscribe to, saved as `subscribing_pricing`.
        available_plans = GQL.list_app_pricing_pks(client, app_name).pricingPlans
        available_plans = [p.name for p in available_plans]
        echo(f"Available plans: {available_plans}")
        exit(1)
    # List all the pricing plans for the app, and get the one the user wants to
    # subscribe to, saved as `subscribing_pricing`.
    pricing_plans = GQL.list_app_pricing_pks(client, app_name).pricingPlans
    subscribing_pricing = None
    for p in pricing_plans:
        if p.name == plan:
            subscribing_pricing = p
            break
    if subscribing_pricing is None:
        echo(
            colorama.Fore.RED
            + f'Pricing plan with the name "{plan}" does not exist.'
            + colorama.Fore.RESET
        )
        available_plans = [p.name for p in pricing_plans]
        echo(f"Available plans: {available_plans}")
        exit(1)
    if current_sub is None:
        # Subscribe to new plan
        GQL.subscribe_to_app(
            client,
            subscriber=auth.user_pk,
            app=app_name,
            pricing=subscribing_pricing.pk,
        )
    elif current_sub.pricing.name == plan:
        echo(
            colorama.Fore.YELLOW
            + f'You are already subscribed to the plan "{plan}".'
            + colorama.Fore.RESET
        )
        exit(1)
    else:
        GQL.change_subscription(
            client, subPK=current_sub.pk, newPricing=subscribing_pricing.pk
        )
    echo(
        terminal.green
        + (
            f'Switching to a new plan: "{subscribing_pricing.name}".'
            if current_sub
            else f'Subscribed to: "{subscribing_pricing.name}".'
        )
        + terminal.normal
    )


@fastapi_subscribe.command("remove", aliases=["rm"])
@click.argument("app_name", required=True)
def subscription_remove(app_name: str):
    """Unsubscribe from an app."""
    try:
        client, auth = get_client_info()
        GQL.unsubscribe_from_app(client, subscriber=auth.user_pk, app=app_name)
    except NotFound:
        echo(
            terminal.red
            + terminal.bold
            + f'You are not currently subscribed to app: "{app_name}".\n'
            + terminal.normal
            + terminal.yellow
            + "To subscribe to a new plan, run: fastcharge subscribe [app_name] --plan [plan_name].\n"
            + terminal.normal
        )
        exit(1)
    else:
        echo(
            terminal.green
            + terminal.bold
            + 'Unsubscribed from app: "{app_name}"'
            + terminal.normal
        )
