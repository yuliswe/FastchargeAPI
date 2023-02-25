import json
from typing import Optional
from botocore import UNSIGNED
from botocore.client import Config
import boto3
import botocore.exceptions


def get_remote_secret(key: str, jwe_secret: bytes, jwt_secret: bytes) -> Optional[str]:
    """Get the secret from the remote server. If decode_secret is provided,
    expect the value retrieved to be a JWT token and decode it using the
    provided secret."""
    from jose import jws
    from jose import jwe

    s3 = boto3.client(
        "s3", region_name="us-east-1", config=Config(signature_version=UNSIGNED)
    )
    try:
        response = s3.get_object(Bucket="cli-auth-bucket", Key=key)
        s3.delete_object(Bucket="cli-auth-bucket", Key=key)
    except botocore.exceptions.ClientError as e:
        if e.response["Error"]["Code"] == "404":
            return None
        elif e.response["Error"]["Code"] == "AccessDenied":
            return None
        else:
            print(f"Error getting S3 object: {e}")

    value = response["Body"].read().decode("utf-8")
    jwt_verified = jws.verify(value, jwt_secret, algorithms=["HS512"])

    encrypted = json.loads(jwt_verified)["encrypted"]
    jwe_decrypted = jwe.decrypt(encrypted, jwe_secret)
    return json.loads(jwe_decrypted)
