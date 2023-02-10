import json
from typing import Optional

from gql import gql
from utils.session import get_current_user
from utils.stripe import get_stripe_api_secret_key
from utils.graphql import get_graphql_client

import stripe
import colorama
import schema as s

stripe.api_key = get_stripe_api_secret_key()


def lambda_handler(event, context):
    try:
        if event["httpMethod"] == "OPTIONS":  # Needed for the frontend CORS
            response = {"statusCode": 200}
        else:
            response = handle_lambda(event, context)
    except Exception as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
        response = {"statusCode": 500, "body": "Internal server error."}
    response.setdefault("headers", {})
    response["headers"]["Access-Control-Allow-Origin"] = "*"  # CORS
    response["headers"]["Access-Control-Allow-Methods"] = "*"  # CORS
    response["headers"]["Access-Control-Allow-Headers"] = "*"  # CORS
    return response


def handle_lambda(event, context):
    if event["httpMethod"] != "POST":
        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Please use POST.",
                }
            ),
        }
    user_email, error = get_current_user(context)
    if error is not None:
        return error

    schema = s.Schema(
        {
            "amount_cents": int,
            "success_url": str,
            "cancel_url": str,
        }
    )
    body = event["body"]
    try:
        data = schema.validate(json.loads(body) if body else {})
    except s.SchemaError as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET, body)
        return {
            "statusCode": 400,
            "body": json.dumps(
                {
                    "ValidationError": str(e),
                }
            ),
        }
    try:
        session = stripe.checkout.Session.create(
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"Top up your FastchargeAPI account: {user_email}",
                        },
                        "unit_amount": int(data["amount_cents"]),
                        "tax_behavior": "exclusive",
                    },
                    "quantity": 1,
                }
            ],
            automatic_tax={
                "enabled": True,
            },
            currency="usd",
            customer=identify_existing_customer(user_email) or None,
            customer_email=user_email,
            mode="payment",
            success_url=data["success_url"],
            cancel_url=data["cancel_url"],
            customer_creation="always",
        )
    except Exception as e:
        print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
        return {"statusCode": 500, "body": str(e)}

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "location": session.url,
            }
        ),
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
