import os

graphql_host = "https://api.graphql.fastchargeapi.com"
payment_api_host = "https://api.payment.fastchargeapi.com"
react_host = "https://fastchargeapi.com"

if os.environ.get("TEST") == "1":
    graphql_host = "http://localhost:4001"
    payment_api_host = "http://localhost:3001"
    react_host = "http://localhost:8001"

if os.environ.get("LOCAL_GRAPHQL") == "1":
    graphql_host = "http://localhost:4000"
    print("Using local graphql")
if os.environ.get("LOCAL_PAYMENT") == "1":
    payment_api_host = "http://localhost:3000"
if os.environ.get("LOCAL_REACT") == "1":
    react_host = "http://localhost:8000"
