from utils.stripe import parse_stripe_webhook_event
from utils.stripe import get_stripe_endpoint_secret
from utils.stripe import get_stripe_api_secret_key
from utils.graphql import get_graphql_client
import stripe
from gql import gql
from gql.transport.requests import RequestsHTTPTransport
import colorama

stripe.api_key = get_stripe_api_secret_key()
endpoint_secret = get_stripe_endpoint_secret()


def lambda_handler(lambda_event, context):
    try:
        return handle_lambda(lambda_event, context)
    except Exception as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
        return {"statusCode": 500, "body": "Internal server error."}


def handle_lambda(lambda_event, context):
    # print(json.dumps(event))
    stripe_event, error = parse_stripe_webhook_event(lambda_event)
    if error is not None:
        return error

    # Handle the checkout.session.completed event. See
    # example-objects/account.json for the structure of the event.
    if stripe_event["type"] == "account.updated":
        data = stripe_event["data"]["object"]
        email = data["email"]
        account_id = data["id"]

        update_stripe_account_id(email, account_id)

    return {"statusCode": 400, "body": f"Invalid event type: {stripe_event['type']}"}


def update_stripe_account_id(email: str, account_id: str):
    client = get_graphql_client()
    try:
        result = client.execute(
            gql(
                """
                query GetUserAndUpdate($email: Email!, $account_id: String!) {
                    user(email: $email) {
                        updateUser(stripeConnectAccountId: $account_id) {
                            stripeConnectAccountId
                        }
                    }
                }
                """
            ),
            variable_values={"email": email, "account_id": account_id},
        )["user"]["updateUser"]
        assert result["stripeConnectAccountId"] == account_id
    except Exception as e:
        print(
            colorama.Fore.RED + f"Failed to update Stripe account ID for {email}"
            " when payment-service/onboard_accept.py tried to connect to the graphql-service.\n"
            + str(e)
            + colorama.Fore.RESET
        )
        raise e
