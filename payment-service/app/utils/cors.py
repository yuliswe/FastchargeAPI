import re


def cors_headers(origin: str) -> str:
    allowed_origins = [r"^http://localhost:?\d*", r"^https://.*fastchargeapi\.com"]
    if any(re.match(al, origin) for al in allowed_origins):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
        }
    else:
        return {}
