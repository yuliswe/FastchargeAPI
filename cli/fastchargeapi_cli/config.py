import os

base_domain = (
    "devfastchargeapi.com"
    if os.environ.get("DEV_DOMAIN") == "1"
    else "fastchargeapi.com"
)
aws_account_id = (
    "209991057786" if os.environ.get("DEV_DOMAIN") == "1" else "887279901853"
)
graphql_host = f"https://api.graphql.{base_domain}"
payment_service_host = f"https://api.v2.payment.{base_domain}"
auth_service_host = f"https://api.v2.auth.{base_domain}"
react_host = f"https://{base_domain}"

if os.environ.get("TEST") == "1":
    graphql_host = "http://localhost:4001"
    payment_service_host = "http://localhost:3001"
    react_host = "http://localhost:8001"

if os.environ.get("LOCAL_GRAPHQL") == "1":
    graphql_host = "http://localhost:4000"
    print("Using local graphql")

if os.environ.get("LOCAL_PAYMENT") == "1":
    print("Using local Payment")
    payment_service_host = "http://localhost:3000"

if os.environ.get("LOCAL_REACT") == "1":
    print("Using local React")
    react_host = "http://localhost:8000"

if os.environ.get("LOCAL_AUTH") == "1":
    print("Using local Auth")
    auth_service_host = "http://localhost:7000"
