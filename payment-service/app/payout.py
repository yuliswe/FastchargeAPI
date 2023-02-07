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
import schema as s

stripe.api_key = get_stripe_api_secret_key()
endpoint_secret = get_stripe_endpoint_secret()


# Stripe's payout API:
#  https://stripe.com/docs/connect/add-and-pay-out-guide?integration=with-code#with-code-pay-out-to-user


def lambda_handler(event, context):
    try:
        return handle_lambda(event, context)
    except Exception as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
        return {"statusCode": 500, "body": "Internal server error."}


def handle_lambda(event, context):
    user_email, error = get_current_user(context)
    if error is not None:
        return error

    data = json.loads(event["body"])
    try:
        api_schema = s.Schema(
            {
                "withdraw_cents": int,
            }
        )
        api_schema.validate(data)
    except s.SchemaError as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
        return {"statusCode": 400, "body": json.dumps({"ValidationError": str(e)})}

    withdraw_cents = data["withdraw_cents"]
    stripe_charges_percent = (2.9 + 0.25 + 0.5) / 100
    stripe_charges_flat = 200 + 50 + 25
    stripe_fee_cents = int(
        stripe_charges_flat + stripe_charges_percent * withdraw_cents
    )
    receive_cents = withdraw_cents - stripe_fee_cents
    if receive_cents <= 0:
        return {
            "statusCode": 400,
            "body": json.dumps(
                {
                    "message": f"Minimum withdraw is ${stripe_fee_cents / 100:.2f}.",
                }
            ),
        }

    client = get_graphql_client()
    account_id = client.execute(
        gql(
            """
            query GetUserStripeConnectAccountId($email: Email!) {
                user(email: $email) {
                    stripeConnectAccountId
                }
            }
            """
        ),
        variable_values={"email": user_email},
    )["user"]["stripeConnectAccountId"]

    stripe_transfer = stripe.Transfer.create(
        amount=receive_cents,
        currency="usd",
        destination=account_id,
    )

    settle_transfer = client.execute(
        gql(
            """
            mutation CreateStripeTransfer(
                $user_email: Email!
                $withdraw_cents: Int!
                $receive_cents: Int!
                $stripe_transfer_id: String!
                $stripe_transfer_object: String!
                $currency: String!
            ) {
                createStripeTransfer(
                    receiver: $user_email, 
                    withdrawCents: $withdraw_cents,
                    receiveCents: $receive_cents,
                    stripeTransferId: $stripe_transfer_id,
                    stripeTransferObject: $stripe_transfer_object,
                    currency: $currency,
                ) {
                    settleStripeTransfer {
                        newBalance
                    }
                }
            }
            """
        ),
        variable_values={
            "user_email": user_email,
            "withdraw_cents": withdraw_cents,
            "receive_cents": receive_cents,
            "stripe_transfer_id": stripe_transfer["id"],
            "stripe_transfer_object": json.dumps(stripe_transfer),
            "currency": stripe_transfer["currency"],
        },
    )["createStripeTransfer"]["settleStripeTransfer"]
    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                # "dashboard_url": get_dashboard_url(user_email),
            }
        ),
    }


# def get_dashboard_url(user_email: str) -> str:
#     client = get_graphql_client()
#     account_id = client.execute(
#         gql(
#             """
#             query GetUserAndUpdate($user_email: Email!) {
#                 user(email: $user_email) {
#                     stripeConnectAccountId
#                 }
#             }
#             """
#         ),
#         variable_values={"user_email": user_email},
#     )["user"]["stripeConnectAccountId"]
#     link = stripe.Account.create_login_link(account_id)
#     return link
