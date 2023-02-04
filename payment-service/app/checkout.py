import json
from typing import Optional

from gql import gql
from utils.session import get_current_user
from utils.stripe import get_stripe_api_secret_key

from utils.graphql import get_graphql_client

import stripe
import colorama

stripe.api_key = get_stripe_api_secret_key()


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

    if event["httpMethod"] != "POST":
        return {"statusCode": 400, "body": "Please use POST."}
    if not (body := event["body"]):
        return {"statusCode": 400, "body": "Please provide amount_cents."}
    else:
        data = json.loads(body)
    if (amount_cents := data.get("amount_cents")) is None:
        return {"statusCode": 400, "body": "Please provide amount_cents."}
    amount_cents = int(data["amount_cents"])
    try:
        session = stripe.checkout.Session.create(
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"Top up your FastchargeAPI account: {user_email}",
                        },
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            customer=identify_existing_customer(user_email) or None,
            customer_email=user_email,
            mode="payment",
            success_url="http://localhost:4242/success",
            cancel_url="http://localhost:4242/cancel",
            customer_creation="always",
        )
    except Exception as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
        return {"statusCode": 500, "body": str(e)}

    return {
        "statusCode": 303,
        "body": json.dumps(
            {
                "location": session.url,
            }
        ),
        "headers": {"Location": session.url},
    }


def identify_existing_customer(user_email: str) -> Optional[str]:
    client = get_graphql_client()
    try:
        return client.execute(
            gql(
                """
                query GetUser($user_email: Email!){
                    user(email: $user_email) {
                        stripeCustomerId
                    }
                }
                """,
            ),
            variable_values={
                "user_email": user_email,
            },
        )["user"]["stripeCustomerId"]
    except Exception as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
        return None
