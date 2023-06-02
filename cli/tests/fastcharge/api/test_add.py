from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.main import fastcharge
from tests.__generated__ import gql_operations as GQL
from tests.utils import (
    create_test_app,
    create_test_user,
    get_admin_gqlclient,
    login_as_user,
    logout_user,
)


class TestFastchargeAPIAdd:
    """Test `fastcharge api add`."""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        self.test_app = create_test_app(
            owner=self.test_user.pk, name="test-app-" + uuid4().hex[:50]
        )
        login_as_user(self.test_user.pk)
        self._create_endpoint()

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def _create_endpoint(self):
        GQL.create_endpoint(
            get_admin_gqlclient(),
            app=self.test_app.name,
            path="/echo",
            method=GQL.HTTPMethod.POST,
            destination="https://example.devfastchargeapi.com",
            description="Echo API",
        )

    def test_fastcharge_api_add(self):
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile={self.test_user.pk}",
                "api",
                "add",
                self.test_app.name,
                "--method=POST",
                "--path",
                "/echo",
                "--destination",
                "https://example.devfastchargeapi.com",
                "--description",
                "Echo API",
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.stdout
        assert (
            "Successfully created an API endpoint '/echo' ~> 'https://example.devfastchargeapi.com'"
            in result.stdout
        )
