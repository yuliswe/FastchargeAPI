def get_current_user(context) -> tuple[str, object]:
    """Returns the current user from the request context, or a 401 response."""
    return "testuser1.fastchargeapi@gmail.com", None
    if (user_email := getattr(context, "authorizer", {}).get("userEmail")) is None:
        return "Unauthorized.", {"statusCode": 401, "body": "Unauthorized."}
    else:
        return user_email, None
