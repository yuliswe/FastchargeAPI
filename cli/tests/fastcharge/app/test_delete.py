from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.exceptions import NotFound
from fastchargeapi_cli.graphql_client import get_client_info
from fastchargeapi_cli.main import fastcharge
from tests.__generated__ import gql_operations as GQL
from tests.utils import create_test_app, create_test_user, login_as_user, logout_user


class TestFastchargeAppDelete:
    """Test `fastcharge app delete`."""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        self.test_app = create_test_app(
            owner=self.test_user.pk, name="test-app" + uuid4().hex[:50]
        )
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def test_app_delete(self):
        result = self.runner.invoke(
            fastcharge,
            [f"--profile={self.test_user.pk}", "app", "delete", self.test_app.pk],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.stdout
        client, auth = get_client_info(self.test_user.pk)
        try:
            app = GQL.verify_app_delete(client, self.test_app.pk)
        except NotFound:
            pass
        else:
            assert False, f"Expected app to be deleted, but got '{app}'"
