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


class TestFastchargeAPIRemove:
    """Test `fastcharge api remove`."""

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

    def test_fastcharge_api_remove(self):
        endpoint = GQL.list_app_endpoints(
            get_admin_gqlclient(), self.test_app.name
        ).endpoints
        assert len(endpoint) == 1, "Expect 1 endpoint to be created."
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile={self.test_user.pk}",
                "api",
                "remove",
                endpoint[0].pk,
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.stdout
        endpoint = GQL.list_app_endpoints(
            get_admin_gqlclient(), self.test_app.name
        ).endpoints
        assert len(endpoint) == 0, "Expect the endpoint to be removed."
        assert "Removed the API endpoint" in result.stdout
