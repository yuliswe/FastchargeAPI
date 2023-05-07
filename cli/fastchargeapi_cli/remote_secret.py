import json
import os
import time
from dataclasses import dataclass
from typing import Any, Optional
from uuid import uuid4

import boto3
from botocore import UNSIGNED
from botocore.client import Config
from botocore.exceptions import ClientError as BotoClientError
from jose import jwe, jws

from .__generated__ import gql_operations as GQL
from .exceptions import NotFound
from .graphql_client import GQLClient


def get_remote_secret_from_s3(
    client: GQLClient, key: str, jwe_secret: bytes, jwt_secret: bytes
) -> Optional[dict]:
    """Get the secret from the remote server. If decode_secret is provided,
    expect the value retrieved to be a JWT token and decode it using the
    provided secret."""

    s3 = boto3.client(
        "s3", region_name="us-east-1", config=Config(signature_version=UNSIGNED)
    )
    try:
        response = s3.get_object(Bucket="cli-auth-bucket", Key=key)
        s3.delete_object(Bucket="cli-auth-bucket", Key=key)
    except BotoClientError as e:
        if e.response["Error"]["Code"] == "404":
            return None
        elif e.response["Error"]["Code"] == "AccessDenied":
            return None
        else:
            print(f"Error getting S3 object: {e}")
            return None

    value = response["Body"].read().decode("utf-8")
    jwt_verified = jws.verify(value, jwt_secret, algorithms=["HS512"])

    encrypted = json.loads(jwt_verified)["encrypted"]
    jwe_decrypted = jwe.decrypt(encrypted, jwe_secret)
    assert jwe_decrypted is not None
    return json.loads(jwe_decrypted)


def get_remote_secret(
    client: GQLClient, key: str, jwe_secret: bytes, jwt_secret: bytes
) -> Optional[dict]:
    """Get the secret from the remote server. If decode_secret is provided,
    expect the value retrieved to be a JWT token and decode it using the
    provided secret."""

    secret = GQL.get_secret(client, key=key)

    if secret is None:
        return None

    jwt_verified = jws.verify(secret.value, jwt_secret, algorithms=["HS512"])

    encrypted = json.loads(jwt_verified)["encrypted"]
    jwe_decrypted = jwe.decrypt(encrypted, jwe_secret)
    assert jwe_decrypted is not None
    return json.loads(jwe_decrypted)


@dataclass
class InteractWithReactQuery:
    """Data for interacting with React app."""

    url_query_secrets: str  # The query string to append to the URL, containing the jwe_secret and jwt_secret
    jwe_secret: bytes  # The secret to use to decrypt the JWE
    jwt_secret: bytes  # The secret to use to verify the JWT
    key: str  # A uuid4 key to use for the remote secret, should be unique for each value being stored


class InteractWithReactResult:
    def __init__(
        self,
        client: GQLClient,
        *,
        jwe_secret: bytes,  # The secret to use to decrypt the JWE
        jwt_secret: bytes,  # The secret to use to verify the JWT
        key: str,  # A uuid4 key to use for the remote secret, should be unique for each value being stored
        poll_max_reached_prompt: str,  # The prompt to show when the max poll count is reached
        poll_max_count: int,  # The max number of times to poll the server
        poll_interval_seconds: int,  # The number of seconds to wait between each poll
        use_s3_bucket_instead_of_graphql: bool,  # Whether to use the S3 bucket instead of the graphql server
    ):
        assert poll_max_count < 100, "Too many polls"
        assert poll_interval_seconds >= 3, "Too short of a poll interval"

        self.client = client
        self.jwe_secret = jwe_secret
        self.jwt_secret = jwt_secret
        self.poll_max_reached_prompt = poll_max_reached_prompt
        self.poll_max_count = poll_max_count
        self.poll_interval_seconds = poll_interval_seconds
        self.use_s3_bucket_instead_of_graphql = use_s3_bucket_instead_of_graphql
        self.key = key
        self.getter_func = (
            get_remote_secret_from_s3
            if use_s3_bucket_instead_of_graphql
            else get_remote_secret
        )

    def read(self) -> Any:
        tries = 0
        while True:
            time.sleep(self.poll_interval_seconds)
            tries += 1
            try:
                if value := self.getter_func(
                    client=self.client,
                    key=self.key,
                    jwe_secret=self.jwe_secret,
                    jwt_secret=self.jwt_secret,
                ):
                    return value
            except NotFound:
                pass
            if tries >= self.poll_max_count:
                input(self.poll_max_reached_prompt)
                continue


def interact_with_react(
    client: GQLClient,
    *,
    poll_max_reached_prompt: str = "Timed out. Press enter to retry.",
    poll_max_count: int = 3,
    poll_interval_seconds: int = 5,
    use_s3_bucket_instead_of_graphql: bool = False,
) -> tuple[InteractWithReactQuery, InteractWithReactResult]:
    """Standardize a way for the CLI to interact with a React app, by providing
    secrets to the app to encrypt data, and store in the server.

    For example, in `fastcharge login`, the cli uses this function to generates
    two secrets, then it passes them by URL query string and open the React app
    in browser. The React app authenticates with Firebase, gets the user
    idToken, and encrypts it using the secrets provided, before sending it to
    store in the server, using the key provided.

    Meanwhile, the CLI polls the server until the key becomes available, and
    then retrieves the encrypted value, decrypts it using the secret, and
    returns it.

    This macheinism is required because the safari server doesn't allow talking
    to a http://localhost server from the react app. Otherwise, we could have
    simply spin up a local server and have the react app talk to it.
    """
    jwe_secret = os.urandom(64)  # 512 bits
    jwt_secret = os.urandom(64)
    key = uuid4().hex
    url_query_secrets = f"jwe={jwe_secret.hex()}&jwt={jwt_secret.hex()}&key={key}"

    return (
        InteractWithReactQuery(
            jwe_secret=jwe_secret,
            jwt_secret=jwt_secret,
            key=key,
            url_query_secrets=url_query_secrets,
        ),
        InteractWithReactResult(
            client=client,
            jwe_secret=jwe_secret,
            jwt_secret=jwt_secret,
            key=key,
            poll_max_reached_prompt=poll_max_reached_prompt,
            poll_max_count=poll_max_count,
            poll_interval_seconds=poll_interval_seconds,
            use_s3_bucket_instead_of_graphql=use_s3_bucket_instead_of_graphql,
        ),
    )
