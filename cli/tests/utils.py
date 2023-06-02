import json
import time
from functools import cache
from uuid import uuid4

import boto3
from fastchargeapi_cli.auth_file import (
    AuthFileContent,
    delete_auth_file,
    get_auth_file_path,
    refresh_id_token,
    write_to_auth_file,
)
from fastchargeapi_cli.graphql_client import GQLClient, get_client_info
from pydantic import ValidationError

from .__generated__ import gql_operations as GQL
from .sqs_graphql_client import PredefinedSQSQueue, get_sqs_graphql_client


def get_from_system_parameter_store(key: str) -> str:
    client = boto3.client("ssm")
    response = client.get_parameter(Name=key, WithDecryption=True)
    return response["Parameter"]["Value"]


@cache
def get_admin_gqlclient() -> GQLClient:
    auth = AuthFileContent(
        **json.loads(
            get_from_system_parameter_store("cli.testing.admin_user_credentials")
        )
    )
    result = refresh_id_token(auth.refresh_token)
    return GQLClient(
        id_token=result.id_token,
        user_email=auth.email,
        user_pk=auth.user_pk,
    )


def create_test_user(email: str) -> GQL.CreateUserCreateuser:
    resp = GQL.create_user(get_admin_gqlclient(), email)
    return resp


def create_test_app(*, owner: str, name: str) -> GQL.CreateTestAppCreateapp:
    resp = GQL.create_test_app(get_admin_gqlclient(), owner=owner, name=name)
    return resp


def login_as_user(user_pk: str) -> AuthFileContent:
    resp = GQL.get_fastcharge_api_id_token(get_admin_gqlclient(), user=user_pk)
    content = write_to_auth_file(
        profile=user_pk,
        id_token=resp.getFastchargeAPIIdToken,
        issuer="fastchargeapi",
        refresh_token="",  # Not supported yet
        user_pk=user_pk,
        email=resp.email,
    )
    assert get_auth_file_path(profile=user_pk).exists(), "Auth file should exist."
    return content


def logout_user(user_pk: str):
    delete_auth_file(profile=user_pk)


def add_money_for_user(user_pk: str, amount: str, wait: bool = True):
    """Add money to user account and wait for it to be reflected in the balance. Caller must have access to the billing SQS queue."""
    assert float(amount) > 0, "amount must be greater than 0"
    try:
        GQL.add_money_to_user_account(
            get_sqs_graphql_client(
                queue=PredefinedSQSQueue.billing_fifo_queue,
                group_id=user_pk,
                dedup_id=f"addMoneyForUser-{user_pk}-{uuid4().hex}",
            ),
            user=user_pk,
            amount=amount,
        )
    except ValidationError as e:
        # SQS will not return anything
        pass
    if wait:
        for attempt in range(10):
            result = GQL.get_user_account_balance(get_admin_gqlclient(), user=user_pk)
            if float(result.balance) == float(amount):
                break
            print(f"Waiting for balance update ({attempt}s):", result.balance)
            time.sleep(1)
            if attempt == 9:
                assert float(result.balance) == float(
                    amount
                ), "add money failed after timeout"
