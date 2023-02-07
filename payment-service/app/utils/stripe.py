from typing import Optional
import stripe


def get_stripe_api_secret_key() -> str:
    return "sk_test_51MSgLaB24cItJ1WSPJhxovkHWjbcIcnCVmYlgCpN16acN7HUUlaLWxxcxtJT46hrvA0QHyqwWl1jxH3JeiM7ZTSi0077ZcdUOZ"


def get_stripe_api_public_key() -> str:
    return "pk_test_51MSgLaB24cItJ1WS4qVcbQqqUBy63OndE77nEdPjHZoCDdl7YpeK1BQmJmfpW77J60hHAV8dAiIXYRrLjDjoNGU800y1oqtNBY"


def get_stripe_endpoint_secret() -> str:
    return "whsec_d8a3c6653fc3e20da28d132c385d70d4ba605eb850b00cc2f3819399acfc6df8"


def parse_stripe_webhook_event(
    lambda_event: object,
) -> tuple[stripe.Event, Optional[dict]]:
    """Parses and validate the signature of a webhook event received from the
    Stripe.

    Returns the (stripe_event, None) if success. Otherwise, returns (None, Http
    error response).
    """
    sig_header = lambda_event["headers"]["Stripe-Signature"]

    try:
        stripe_event = stripe.Webhook.construct_event(
            lambda_event["body"], sig_header, get_stripe_endpoint_secret()
        )
    except ValueError as e:
        # Invalid payload
        print("Invalid payload")
        return None, {"statusCode": 400, "body": "Invalid payload"}
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print("Invalid signature")
        return None, {"statusCode": 400, "body": "Invalid signature"}
    else:
        return stripe_event, None
