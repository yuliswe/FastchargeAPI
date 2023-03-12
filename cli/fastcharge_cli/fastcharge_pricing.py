from typing import Optional
from .fastcharge_app import AppInfo, get_app, get_app_or_prompt_exit
from .graphql import get_client_info
from .groups import fastcharge
import click
from gql import gql
import colorama
from dataclasses import dataclass
from click_aliases import ClickAliasedGroup
from .exceptions import AlreadyExists
from blessings import Terminal
from click import echo

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
@click.option("-a", "--app", "app_name", help="Show pricing for a specific app.")
@click.help_option("-h", "--help")
def pricing_list(app_name: str):
    """List pricing plans for each app."""
    client, email = get_client_info()
    if app_name:
        if get_app_or_prompt_exit(app_name) is None:
            return
        apps = [
            client.execute(
                gql(
                    """
                    query($app_name: String!) {
                        app(name: $app_name) {
                            name
                            description
                            pricingPlans {
                                pk
                                name
                                callToAction
                                minMonthlyCharge
                                chargePerRequest
                            }
                        }
                    }
                    """
                ),
                {
                    "email": email,
                    "app_name": app_name,
                },
            )["app"]
        ]
    else:
        apps = client.execute(
            gql(
                """
                query($email:Email) {
                    user(email: $email) {
                        apps {
                            name
                            description
                            pricingPlans {
                                pk
                                name
                                callToAction
                                minMonthlyCharge
                                chargePerRequest
                            }
                        }
                    }
                }
                """
            ),
            {
                "email": email,
                "app": app_name,
            },
        )["user"]["apps"]
    for app in apps:
        pretty_print_app_pricing(app)
        echo()


def pretty_print_app_pricing(app_info: dict):
    plans = [PricingInfo(**p) for p in app_info["pricingPlans"]]
    echo(terminal.blue + terminal.bold + f"app: {app_info['name']}" + terminal.normal)
    # echo(
    #     colorama.Style.DIM
    #     + f"\n  {app['description'] or 'No description.'}"
    #     + colorama.Style.RESET_ALL
    # )
    if plans:
        echo(terminal.bold + " Available plans:" + terminal.normal)
    else:
        echo(colorama.Style.RESET_ALL + " No pricing plans available.")
    for plan in plans:
        echo(colorama.Style.RESET_ALL, nl=False)
        echo(terminal.green + terminal.bold + f"  name: {plan.name}" + terminal.normal)
        echo(terminal.bold + f"  id: {plan.pk}" + terminal.normal)
        if plan.callToAction:
            echo("  " + plan.callToAction)
        echo(f"  ${float(plan.minMonthlyCharge):.2f} monthly subscription", nl=False)
        echo(
            f" + additional "
            + f"${float(plan.chargePerRequest):.2f}".rstrip("0").rstrip(".")
            + " per request"
        )
        echo("  First 1000 requests are free of charge.")
        echo(colorama.Style.DIM + "  Call of action." + colorama.Style.RESET_ALL)
        echo()


@fastcharge_dev_pricing.command("add")
@click.option(
    "-a", "--app", "app_name", help="Show pricing for a specific app.", required=True
)
@click.option("-n", "--name", help="Name of the pricing plan.", required=True)
@click.option(
    "-m",
    "--min-monthly-charge",
    type=float,
    help="Minimum monthly charge.",
    required=True,
)
@click.option(
    "-r", "--charge-per-request", type=float, help="Charge per request.", required=True
)
@click.option("-c", "--call-to-action", help="Call to action for the pricing plan.")
@click.help_option("-h", "--help")
def pricing_add(
    app_name: str,
    name: str,
    call_to_action: str,
    min_monthly_charge: str,
    charge_per_request: str,
):
    """Add a pricing plan to an existing app."""
    client, email = get_client_info()
    app = get_app_or_prompt_exit(app_name)
    try:
        result = client.execute(
            gql(
                """
                mutation(
                    $app: String!,
                    $name: String!,
                    $callToAction: String!,
                    $minMonthlyCharge: String!,
                    $chargePerRequest: String!
                ) {
                    createPricing(
                        app: $app,
                        name: $name,
                        callToAction: $callToAction,
                        minMonthlyCharge: $minMonthlyCharge,
                        chargePerRequest: $chargePerRequest
                    ) {
                        name
                    }
                }
                """
            ),
            variable_values={
                "app": app_name,
                "name": name,
                "callToAction": call_to_action or "",
                "minMonthlyCharge": str(min_monthly_charge),
                "chargePerRequest": str(charge_per_request),
            },
        )
        echo(result)
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
