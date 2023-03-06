import json
import time
from typing import Optional

from utils.stripe import parse_stripe_webhook_event

from utils.graphql import get_graphql_client
from utils.sqs_graphql import get_sqs_graphql_client, PredefinedSQSQueue
import stripe
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport

stripe.api_key = "pk_test_51MSgLaB24cItJ1WS4qVcbQqqUBy63OndE77nEdPjHZoCDdl7YpeK1BQmJmfpW77J60hHAV8dAiIXYRrLjDjoNGU800y1oqtNBY"
endpoint_secret = (
    "whsec_d8a3c6653fc3e20da28d132c385d70d4ba605eb850b00cc2f3819399acfc6df8"
)

# TODO: Need to make the event handling idempotent


# Read:
def lambda_handler(event, context):
    # print(json.dumps(event))

    stripe_event, error = parse_stripe_webhook_event(event)
    if error is not None:
        return error

    # Handle the checkout.session.completed event
    if stripe_event["type"] == "checkout.session.completed":
        session = stripe_event["data"]["object"]
        # Check if the order is already paid (for example, from a card payment)
        #
        # A delayed notification payment will have an `unpaid` status, as
        # you're still waiting for funds to be transferred from the customer's
        # account.
        if session.payment_status == "paid":
            # Save an order in your database, marked as 'awaiting payment'
            return create_and_fulfill_order(session)
        else:
            return create_order(session)

    elif stripe_event["type"] == "checkout.session.async_payment_succeeded":
        session = stripe_event["data"]["object"]

        # Fulfill the purchase
        return fulfill_order(session)

    elif stripe_event["type"] == "checkout.session.async_payment_failed":
        session = stripe_event["data"]["object"]

        # Send an email to the customer asking them to retry their order
        return email_customer_about_failed_payment(session)

    return {"statusCode": 400, "body": f"Invalid event type: {stripe_event['type']}"}


# TODO: Make this idempotent
def fulfill_order(session):
    session_id = session["id"]
    payment_intent = session["payment_intent"]
    user_email = session["customer_details"]["email"]
    currency = session["currency"]
    payment_status = session["payment_status"]
    amount_cents = session["amount_total"]
    client = get_graphql_client()
    update_customer_id(user_email, session["customer"])
    try:
        get_sqs_graphql_client(
            queue=PredefinedSQSQueue.billing_fifo_queue,
            dedup_id=f"{user_email}-{time.time()}-{session_id}",
            group_id=user_email,
        ).execute(
            gql(
                """
                query GetStripePaymentAcceptObjectAndFulfill (
                    $stripeSessionId: String!,
                    $stripeSessionObject: String!,
                    $stripePaymentStatus: String!,
                ) {
                    stripePaymentAccept(stripeSessionId: $stripeSessionId) {
                        updateStripePaymentAccept(
                            stripePaymentStatus: $stripePaymentStatus,
                            stripeSessionObject: $stripeSessionObject,
                        ) {
                            createdAt
                        }
                        settlePayment(
                            stripeSessionObject: $stripeSessionObject,
                        ) {
                            createdAt
                        }
                    }
                }
                """
            ),
            variable_values={
                "stripeSessionId": session_id,
                "stripeSessionObject": json.dumps(session),
                "stripePaymentStatus": payment_status,
            },
        )
    except Exception as e:
        print(e)
        return {
            "statusCode": 500,
            "body": "Failed to fulfill order with the graphql service.",
        }
    return {"statusCode": 200, "body": json.dumps({})}


# TODO: Make this idempotent
def create_and_fulfill_order(session):
    session_id = session["id"]
    payment_intent = session["payment_intent"]
    user_email = session["customer_details"]["email"]
    currency = session["currency"]
    payment_status = session["payment_status"]
    amount_cents = session["amount_total"]

    try:
        get_sqs_graphql_client(
            queue=PredefinedSQSQueue.billing_fifo_queue,
            dedup_id=f"{user_email}-{time.time()}-{session_id}",
            group_id=user_email,
        ).execute(
            gql(
                """
                mutation CreateStripePaymentAcceptAndSettle (
                    $user: String!,
                    $amount: NonNegativeDecimal!,
                    $currency: String!,
                    $stripePaymentStatus: String!,
                    $stripeSessionId: String!,
                    $stripePaymentIntent: String!,
                    $stripeSessionObject: String!,
                ) {
                    createStripePaymentAccept(
                        user: $user,
                        amount: $amount,
                        currency: $currency,
                        stripePaymentStatus: $stripePaymentStatus,
                        stripeSessionId: $stripeSessionId,
                        stripePaymentIntent: $stripePaymentIntent,
                        stripeSessionObject: $stripeSessionObject,
                    ) {
                        settlePayment(
                            stripeSessionObject: $stripeSessionObject,
                        ) {
                            createdAt
                        }
                    }
                }
                """
            ),
            variable_values={
                "user": user_email,
                "amount": f"{amount_cents / 100:.2f}",
                "currency": currency,
                "stripePaymentStatus": payment_status,
                "stripeSessionId": session_id,
                "stripePaymentIntent": payment_intent,
                "stripeSessionObject": json.dumps(session),
            },
        )
    except Exception as e:
        print(e)
        return {
            "statusCode": 500,
            "body": "Failed to create order with the graphql server.",
        }
    return {"statusCode": 200, "body": json.dumps({})}


# TODO: Make this idempotent
def create_order(session):
    session_id = session["id"]
    payment_intent = session["payment_intent"]
    user_email = session["customer_details"]["email"]
    currency = session["currency"]
    payment_status = session["payment_status"]
    amount_cents = session["amount_total"]

    try:
        get_sqs_graphql_client(
            queue=PredefinedSQSQueue.billing_fifo_queue,
            dedup_id=f"{user_email}-{time.time()}-{session_id}",
            group_id=user_email,
        ).execute(
            gql(
                """
                mutation (
                    $user: String!,
                    $amount: NonNegativeDecimal!,
                    $currency: String!,
                    $stripePaymentStatus: String!,
                    $stripeSessionId: String!,
                    $stripePaymentIntent: String!,
                    $stripeSessionObject: String!,
                ) {
                    createStripePaymentAccept(
                        user: $user,
                        amount: $amount,
                        currency: $currency,
                        stripePaymentStatus: $stripePaymentStatus,
                        stripeSessionId: $stripeSessionId,
                        stripePaymentIntent: $stripePaymentIntent,
                        stripeSessionObject: $stripeSessionObject,
                    ) {
                        createdAt
                    }
                }
                """
            ),
            variable_values={
                "user": user_email,
                "amount": f"{amount_cents / 100:.2f}",
                "currency": currency,
                "stripePaymentStatus": payment_status,
                "stripeSessionId": session_id,
                "stripePaymentIntent": payment_intent,
                "stripeSessionObject": json.dumps(session),
            },
        )
    except Exception as e:
        print(e)
        return {
            "statusCode": 500,
            "body": "Failed to create order with the graphql server.",
        }
    return {"statusCode": 200, "body": json.dumps({})}


# TODO: Send email
def email_customer_about_failed_payment(session):
    session_id = session["id"]
    payment_intent = session["payment_intent"]
    user_email = session["customer_email"]
    currency = session["currency"]
    payment_status = session["payment_status"]
    amount_cents = session["amount_total"]
    return {"statusCode": 500}


def update_customer_id(user_email: str, stripe_customer: str) -> Optional[str]:
    client = get_graphql_client()
    client.execute(
        gql(
            """
            query GetUserAndUpdate($user_email: Email!, $stripe_customer: String!){
                user(email: $user_email) {
                    updateUser(stripeCustomerId: $stripe_customer) {
                        stripeCustomerId
                    }
                }
            }
            """
        ),
        variable_values={
            "user_email": user_email,
            "stripe_customer": stripe_customer,
        },
    )
