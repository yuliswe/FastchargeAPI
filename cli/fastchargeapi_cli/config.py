import os

graphql_host = "https://api.graphql.fastchargeapi.com"
payment_service_host = "https://api.v2.payment.fastchargeapi.com"
auth_service_host = "https://api.v2.auth.fastchargeapi.com"
react_host = "https://fastchargeapi.com"

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
