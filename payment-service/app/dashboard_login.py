import json
from utils.graphql import get_graphql_client
from utils.stripe import get_stripe_api_secret_key
from utils.session import get_current_user
import stripe
from gql import gql
import colorama

stripe.api_key = get_stripe_api_secret_key()


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

    client = get_graphql_client()
    account_id = client.execute(
        gql(
            """
            query GetUserAndUpdate($user_email: Email!) {
                user(email: $user_email) {
                    stripeConnectAccountId
                }
            }
            """
        ),
        variable_values={"user_email": user_email},
    )["user"]["stripeConnectAccountId"]

    print("Generating Stripe login link for account:", account_id)
    # This can fail if the account has not completed onboarding setup.
    link = stripe.Account.create_login_link(account_id)
    return {"statusCode": 200, "body": json.dumps({"location": link["url"]})}
