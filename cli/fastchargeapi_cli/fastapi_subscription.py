from typing import Optional

import click
import colorama
from blessings import Terminal
from click import echo
from click_aliases import ClickAliasedGroup

from .__generated__ import gql_operations as GQL
from .context_obj import ContextObject
from .exceptions import NotFound
from .graphql_client import get_client_info
from .groups import fastapi

terminal = Terminal()


@fastapi.group("subscription", cls=ClickAliasedGroup, aliases=["subs"])
@click.help_option("-h", "--help")
def fastapi_subscribe():
    """Manage your account subscriptions."""
    pass


@fastapi_subscribe.command("list", aliases=["ls"])
@click.pass_obj
def subscribe_list(ctx_obj: ContextObject):
    """List your subscriptions."""
    client, auth = get_client_info(ctx_obj.profile)
    subscriptions = GQL.list_all_subscriptions_for_user(
        client, user=auth.user_pk
    ).subscriptions
    if not subscriptions:
        echo(terminal.yellow("You are not subscribed to any apps."))
        echo("Use `fastapi subs add [APP_NAME] --plan [NAME]` to subscribe to an app.")
        exit(0)
    echo(terminal.yellow("All apps that you are currently subscribed to:\n"))
    for sub in subscriptions:
        app = sub.app
        pricing = sub.pricing
        echo(
            terminal.blue
            + terminal.bold
            + f'App "{app.name}": \n Currently subscribed to "{pricing.name}":'
            + terminal.normal
        )
        echo(
            f"  ${float(pricing.minMonthlyCharge):.2f} during active month + additional ${pricing.chargePerRequest} per request"
        )
        echo("  First 1000 requests are free of charge.")
        echo()


@fastapi_subscribe.command("add", aliases=[])
@click.argument("app_name", required=True)
@click.option("-p", "--plan", help="Name of the plan to subscribe to.")
@click.pass_obj
def subscription_add(ctx_obj: ContextObject, app_name: str, plan: Optional[str] = None):
    """Subscribe to an app."""
    client, auth = get_client_info(ctx_obj.profile)
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
@click.pass_obj
def subscription_remove(ctx_obj: ContextObject, app_name: str):
    """Unsubscribe from an app."""
    try:
        client, auth = get_client_info(ctx_obj.profile)
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
        echo(terminal.green(f'Unsubscribed from "{app_name}".'))
