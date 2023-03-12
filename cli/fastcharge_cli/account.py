from .remote_secret import interact_with_react

from .graphql import get_client_info
from click import echo
from . import config
from blessings import Terminal
import webbrowser

terminal = Terminal()


def do_account_topup(amount: float):
    """Top up your FastchargeAPI account.

    Amount in USD.
    """
    amount_cents = int(amount * 100)
    client, user_email = get_client_info()

    query, result = interact_with_react(
        poll_max_count=10,
        poll_max_reached_prompt="Press enter after completing in browser.",
    )
    location = (
        f"{config.react_host}/topup?amount_cents={amount_cents}&"
        + query.url_query_secrets
    )
    webbrowser.open_new(location)
    echo("Please complete payment in browser:")
    echo(terminal.blue + " " + location + terminal.normal)
    result = result.read()  # block

    if result["status"] == "success":
        echo(terminal.green + "Payment successful." + terminal.normal)
    elif result["status"] == "canceled":
        echo(terminal.red + "Payment canceled." + terminal.normal)
