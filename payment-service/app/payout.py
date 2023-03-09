import time
import json
from typing import Optional

from utils.session import get_current_user
from inspect import currentframe, getframeinfo
from utils.stripe import get_stripe_endpoint_secret
from utils.stripe import get_stripe_api_secret_key
from utils.graphql import get_graphql_client
from utils.sqs_graphql import get_sqs_graphql_client, PredefinedSQSQueue
import stripe
from gql import gql
import colorama
import schema as s

stripe.api_key = get_stripe_api_secret_key()
endpoint_secret = get_stripe_endpoint_secret()


# Stripe's payout API:
#  https://stripe.com/docs/connect/add-and-pay-out-guide?integration=with-code#with-code-pay-out-to-user


#
# This service is called when the API publisher wants to withdrawl money from
# their FastchargeAPI accounts to their Stripe account. At this time, the
# minimum fee charged by Stripe is:
#
#   $2 to keep the API publisher's Stripe Express account open 0.25% + $0.25 to
#   transfer the money to the API publisher's bank account 2.9% + $0.3 when the
#   API customer tops up their account, which should be paid by the API
#   publisher. 0.5% to collect taxes
#
# The total percentage fee is 3.65%, the total flat fee is $2.55.
#
# The workflow is:
#   1. The API publisher calls this API to withdrawl money from their
#      FastchargeAPI account.
#   2. This API checks if the API publisher has enough money in their
#      FastchargeAPI account, as a sanity check. However, because the API could
#      be called parallelly, the balance retrieved could be not trusted.
#   3. This API puts a createStripeTransfer mutation in the GraphQL queue, which
#      is processed sequentially. The graphql server upon receiving the command,
#      checks again if the API publisher has enough money in their
#      FastchargeAPI, and rejects the creation when necessary. This time, the
#      balance can be trusted, because all billing queue messages are processed
#      one by one.
#   4. The graphql server creates a StripeTransfer, and settles immediate to
#      substract the amount from the API publisher's FastchargeAPI account.
#
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
    stripe_charges_percent = 3.65 / 100
    stripe_charges_flat = 255
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

    # Check if the user has enough money in their account.
    balance = get_user_account_balance_cents(user_email)
    if balance < withdraw_cents:
        return {
            "statusCode": 400,
            "body": json.dumps(
                {
                    "message": f"Not enough money in your account. You have ${balance / 100:.2f}.",
                }
            ),
        }

    # Create a StripeTransfer and settle immediately. This will substract the
    # amount from the user's balance.
    get_sqs_graphql_client(
        queue=PredefinedSQSQueue.billing_fifo_queue,
        dedup_id=f"{user_email}-{int(time.time())}",
        group_id="main",
    ).execute(
        gql(
            """
            mutation CreateStripeTransfer(
                $userEmail: Email!
                $withdrawAmount: NonNegativeDecimal!
                $receiveAmount: NonNegativeDecimal!
                $currency: String!
            ) {
                createStripeTransfer(
                    receiver: $userEmail, 
                    withdrawAmount: $withdrawAmount,
                    receiveAmount: $receiveAmount,
                    currency: $currency,
                ) {
                    settleStripeTransfer {
                        createdAt
                    }
                }
            }
            """
        ),
        variable_values={
            "userEmail": user_email,
            "withdrawAmount": f"{withdraw_cents / 100:.2f}",
            "receiveAmount": f"{receive_cents / 100:.2f}",
            "currency": "usd",
            # "stripe_transfer_id": stripe_transfer["id"],
            # "stripe_transfer_object": json.dumps(stripe_transfer),
        },
    )
    return {
        "statusCode": 200,
        "body": json.dumps({}),
    }


def get_user_account_balance_cents(user: str) -> int:
    client = get_graphql_client()
    # result is a string in dollar
    result = client.execute(
        gql(
            """
            query GetUserAccountBalance($email: Email!) {
                user(email: $email) {
                    balance
                }
            }
            """
        ),
        variable_values={"email": user},
    )["user"]["balance"]
    return int(float(result) * 100)
