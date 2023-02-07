# from utils.stripe import parse_stripe_webhook_event
# from utils.stripe import get_stripe_endpoint_secret
# from utils.stripe import get_stripe_api_secret_key
# from utils.graphql import get_graphql_client
# import stripe
# from gql import gql
# import colorama

# stripe.api_key = get_stripe_api_secret_key()
# endpoint_secret = get_stripe_endpoint_secret()


# def lambda_handler(lambda_event, context):
#     try:
#         return handle_lambda(lambda_event, context)
#     except Exception as e:
#         print(colorama.Fore.RED + str(e) + colorama.Fore.RESET)
#         return {"statusCode": 500, "body": "Internal server error."}


# def handle_lambda(lambda_event, context):
#     # print(json.dumps(event))
#     stripe_event, error = parse_stripe_webhook_event(lambda_event)
#     if error is not None:
#         return error

#     # Stripe events: https://stripe.com/docs/api/events/types
#     if stripe_event["type"] == "transfer.updated":
#         # See https://stripe.com/docs/api/payouts/object
#         payout = stripe_event["data"]["object"]
#         return handle_payout_paid(payout)

#     return {"statusCode": 400, "body": f"Invalid event type: {stripe_event['type']}"}


# def handle_payout_paid(payout: dict):
#     payout_id = payout["id"]
#     amount_cents = payout["amount"]
#     status = "paid"
#     client = get_graphql_client()
