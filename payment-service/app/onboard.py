import json
from typing import Optional

from utils.session import get_current_user
from inspect import currentframe, getframeinfo
from utils.stripe import get_stripe_endpoint_secret
from utils.stripe import get_stripe_api_secret_key
from utils.graphql import get_graphql_client
import stripe
from gql import gql
import colorama

stripe.api_key = get_stripe_api_secret_key()
endpoint_secret = get_stripe_endpoint_secret()


# For testing, use these bank account numbers:
#  https://stripe.com/docs/connect/testing#account-numbers


def lambda_handler(event, context):
    try:
        return handle_lambda(event, context)
    except Exception as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
        return {"statusCode": 500, "body": "Internal server error."}


def handle_lambda(event, context):
    """
    Creates a Stripe Express account and returns a link to the onboarding. See
    https://stripe.com/docs/connect/express-accounts for details on the flow.
    """
    user_email, error = get_current_user(context)
    if error is not None:
        return error

    queryStringParameters = (
        event.get("queryStringParameters", {}) or {}
    )  # because could be None
    if (return_url := queryStringParameters.get("return_url")) is None:
        return {"statusCode": 400, "body": "Please provide return_url."}
    if (refresh_url := queryStringParameters.get("refresh_url")) is None:
        return {"statusCode": 400, "body": "Please provide refresh_url."}
    # refresh_url = body.get("refresh_url", None)

    # It happens when the user has already onboarded and has a Stripe account,
    # but is revisiting the page becuase they didn't complete the onboarding the
    # previous time.
    account_id = check_existing_connected_account(user_email)
    print(colorama.Fore.YELLOW + f"account_id: {account_id}" + colorama.Fore.RESET)

    for attempts in (0, 1):
        print(colorama.Fore.YELLOW + f"attempts {attempts}: " + colorama.Fore.RESET)
        if account_id is None:
            # Bascially calls this API. See supported arguments:
            # API: https://stripe.com/docs/api/accounts/create
            # Flow: https://stripe.com/docs/connect/express-accounts#configure-onboarding
            account_id = stripe.Account.create(
                type="express",
                email=user_email,
            )["id"]
            print(
                colorama.Fore.YELLOW
                + f"created new stripe account: {account_id}"
                + colorama.Fore.RESET
            )

        try:
            print(
                colorama.Fore.YELLOW
                + f"resuing stripe account id: {account_id}"
                + colorama.Fore.RESET
            )
            link = stripe.AccountLink.create(
                account=account_id,
                refresh_url=refresh_url,
                return_url=return_url,
                type="account_onboarding",
            )
            break
        except Exception as e:
            # Usually the account_id we retrieved from the DB is correct. If somehow
            # this account_id is corrupted, we can try to make a new account for
            # this user.
            print(
                colorama.Fore.RED
                + "Something when wrong when trying to reuse the stripe account id retrieved from the graphql-service and create a account link."
                + " This is probably because the account_id is invalid. We will try to create a new account for this user."
                + colorama.Fore.RESET
            )
            if attempts < 1:
                account_id = None
                continue
            else:
                raise

    gqlclient = get_graphql_client()
    try:
        result = gqlclient.execute(
            gql(
                """
                query GetUserAndUpdate($user_email: Email!, $stripe_account_id: String!) {
                    user(email: $user_email) {
                        updateUser(stripeConnectAccountId: $stripe_account_id) {
                            stripeConnectAccountId
                        }
                    }
                }
                """
            ),
            variable_values={
                "user_email": user_email,
                "stripe_account_id": account_id,
            },
        )
        assert result["user"]["updateUser"]["stripeConnectAccountId"] == account_id
    except Exception as e:
        frameinfo = getframeinfo(currentframe())
        print(
            colorama.Fore.RED
            + f"{frameinfo.filename}:{frameinfo.lineno} Failed to update Stripe account ID for {user_email}"
            + colorama.Fore.RESET
        )
        raise e

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",  # Required for frontend /onboard to work.
        },
        "body": json.dumps(
            {
                "location": link[
                    "url"
                ],  # This is a required key for the frontend /onboard to work.
            }
        ),
    }


def check_existing_connected_account(email: str) -> Optional[str]:
    """Query the user and returns the Stripe Connect Account ID if it exists."""
    client = get_graphql_client()
    id = client.execute(
        gql(
            """
            query GetUser($email: Email!) {
                user(email: $email) {
                    stripeConnectAccountId
                }
            }
            """
        ),
        variable_values={"email": email},
    )["user"]["stripeConnectAccountId"]
    return id or None
