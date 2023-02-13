from typing import Optional

from blessings import Terminal

from .dev_pricing import PricingInfo, pretty_print_app_pricing
from .dev_app import AppInfo, get_app
from .graphql import get_client_info
from .groups import fastcharge_client
import click
from gql import gql
import colorama
from dataclasses import dataclass
from click_aliases import ClickAliasedGroup
from click import echo
from .exceptions import NotFound

terminal = Terminal()


@fastcharge_client.group("subscription", cls=ClickAliasedGroup, aliases=["sub"])
@click.help_option("-h", "--help")
def fastcharge_subscribe():
    """Manage your account subscriptions."""
    pass


@fastcharge_subscribe.command("list", aliases=["ls"])
def subscribe_list():
    """List your subscriptions."""
    client, email = get_client_info()
    subscriptions = client.execute(
        gql(
            """
            query GetSubscriptions($email: Email) {
                user(email: $email) {
                    subscriptions {
                        app {
                            name
                        }
                        pricing {
                            name
                            minMonthlyCharge
                            chargePerRequest
                        }
                    }
                }
            }
            """
        ),
        {"email": email},
    )["user"]["subscriptions"]
    echo(terminal.yellow("All apps that you are currently subscribed to:\n"))
    for sub in subscriptions:
        app = sub["app"]
        pricing = sub["pricing"]
        echo(
            terminal.blue
            + terminal.bold
            + f'App "{app["name"]}": \n Current pricing plan "{pricing["name"]}":'
            + terminal.normal
        )
        echo(
            f"  ${float(pricing['minMonthlyCharge']):.2f} monthly subscription",
            nl=False,
        )
        echo(
            f" + additional "
            + f"${float(pricing['chargePerRequest']):.2f}".rstrip("0").rstrip(".")
            + " per request"
        )
        echo("  First 1000 requests are free of charge.")
        echo()


@fastcharge_subscribe.command("add")
@click.argument("app_name", required=True)
@click.option("-p", "--plan", help="Plan to subscribe to.")
def fastcharge_subscription_add(app_name: str, plan: Optional[str] = None):
    """Subscribe to an app."""
    client, email = get_client_info()
    app = get_app(app_name)
    if app is None:
        echo(colorama.Fore.RED + f'An app with the name "{app_name}" does not exist.')
        exit(1)
    # Get the pricing plan the user is currently subscribed to.
    try:
        current_sub = client.execute(
            gql(
                """
                    query GetCurrentSubscription($user_email: Email, $app_name: String) {
                        subscription(subscriber: $user_email, app: $app_name) {
                            pricing {
                                name
                                callToAction
                                minMonthlyCharge
                                chargePerRequest
                            }
                        }
                    }
                    """
            ),
            variable_values={"app_name": app_name, "user_email": email},
        )["subscription"]["pricing"]
    except NotFound:
        current_sub = None
    # If no plan is specified, print out the available plans.
    if not plan:
        if current_sub:
            echo(
                terminal.green
                + terminal.bold
                + f'\nYou are currently subscribed to "{app_name}" with the plan "{current_sub["name"]}".\n'
                + terminal.normal
            )
        app_info = client.execute(
            gql(
                """
                query GetPricingPlans($app: String!){
                    app(name: $app) {
                        name
                        description
                        pricingPlans {
                            name
                            callToAction
                            minMonthlyCharge
                            chargePerRequest
                        }
                    }
                }
                """
            ),
            variable_values={"app": app_name},
        )["app"]
        echo(
            colorama.Fore.YELLOW
            + "To subcribe to a new plan, specify with --plan [name].\n"
        )
        pretty_print_app_pricing(app_info)
        exit(1)
    # Delete old plan the user is currently subscribed to.
    if current_sub:
        unsubscribe(app_name)
    # Subscribe to new plan
    try:
        result = client.execute(
            gql(
                """
                mutation Subscribe($subscriber: Email!, $app: String!, $pricing: String!) {
                    createSubscription(subscriber: $subscriber, app: $app, pricing: $pricing) {
                        pricing {
                            name
                        }
                        app {
                            name
                        }
                    }
                }
                """
            ),
            {"subscriber": email, "app": app_name, "pricing": plan},
        )["createSubscription"]
    except NotFound:
        echo(
            terminal.red
            + terminal.bold
            + f"Pricing plan does not exist: {plan}"
            + terminal.noemal
        )
        exit(1)
    pricing = result["pricing"]
    echo(
        terminal.green
        + terminal.bold
        + (
            f"Switching to a new plan: \"{pricing['name']}\""
            if current_sub
            else f"Subscribed to: \"{pricing['name']}\""
        )
        + terminal.normal
    )


@fastcharge_subscribe.command("remove", aliases=["rm"])
@click.argument("app_name", required=True)
def fastcharge_subscription_remove(app_name: str):
    """Unsubscribe from an app."""
    try:
        subscription = unsubscribe(app_name)
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


def unsubscribe(app_name: str):
    client, email = get_client_info()
    subscription = client.execute(
        gql(
            """
            query Unsubscribe($subscriber: Email!, $app: String!) {
                subscription(subscriber: $subscriber, app: $app) {
                    deleteSubscription {
                        pricing {
                            name
                        }
                    }
                }
            }
            """
        ),
        {"subscriber": email, "app": app_name},
    )["subscription"]
    return subscription
