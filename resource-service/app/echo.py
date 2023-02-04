import json


def lambda_handler(event, context):
    if event["httpMethod"] == "GET":
        return {
            "statusCode": 200,
            "body": json.dumps(
                {"description": "POST to this endpoint to echo the body"}
            ),
        }
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
        },
        "isBase64Encoded": False,
        "body": json.dumps(event),
    }
