from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.graphql_client import get_client_info
from fastchargeapi_cli.main import fastapi
from tests.__generated__ import gql_operations as GQL
from tests.utils import create_test_user, login_as_user, logout_user


class TestAccountUpdate:
    """Test `fastapi account update`"""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def test_account_update(self):
        update = {
            "author": f"author_{uuid4().hex}",
        }
        result = self.runner.invoke(
            fastapi,
            [
                f"--profile",
                self.test_user.pk,
                "account",
                "update",
                *[f"--{k}={v}" for k, v in update.items()],
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0
        client, auth = get_client_info(self.test_user.pk)
        account = GQL.verify_account_update(client, self.test_user.pk)

        assert account is not None

        for k, v in update.items():
            assert (
                getattr(account, k) == v
            ), f"Expected .{k} to be updated to '{v}', but got '{getattr(account, k)}'"
