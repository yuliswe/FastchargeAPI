import re
from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.main import fastapi
from tests.__generated__ import gql_operations as GQL
from tests.utils import (
    create_test_app,
    create_test_user,
    get_admin_gqlclient,
    login_as_user,
    logout_user,
)


class TestAPIList:
    """Test `fastapi api list`."""

    def setup_method(self):
        app_owner_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        api_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.app_owner = create_test_user(app_owner_email)
        self.api_user = create_test_user(api_user_email)
        self.test_app = create_test_app(
            owner=self.app_owner.pk, name="test-app-" + uuid4().hex[:50]
        )
        login_as_user(self.app_owner.pk)
        self.ep1 = self._create_endpoint("/echo1")
        self.ep2 = self._create_endpoint("/echo2")
        login_as_user(self.api_user.pk)

    def teardown_method(self):
        logout_user(self.app_owner.pk)
        logout_user(self.api_user.pk)

    def _create_endpoint(self, path: str) -> GQL.CreateEndpointCreateendpoint:
        return GQL.create_endpoint(
            get_admin_gqlclient(),
            path=path,
            app=self.test_app.name,
            method=GQL.HTTPMethod.POST,
            destination="https://example.fastchargeapi.com",
            description=f"Echo API from {path}",
        )

    def test_api_list(self):
        result = self.runner.invoke(
            fastapi,
            [
                f"--profile={self.api_user.pk}",
                "api",
                "list",
                self.test_app.name,
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.stdout

        pk = re.search(r"^\s+ID:\s+(\S+)", result.output, re.MULTILINE)
        assert pk is not None, "Should show ID."
        assert pk.group(1) == self.ep1.pk, "Should show correct ID."

        method = re.search(r"^\s+HTTP Method:\s+(\S+)", result.output, re.MULTILINE)
        assert method is not None, "Should show HTTP Method."
        assert method.group(1) == "POST", "Should show correct HTTP Method."

        endpoint = re.search(r"^\s+Endpoint:\s+(\S+)$", result.output, re.MULTILINE)
        assert endpoint is not None, "Should show Endpoint."
        assert (
            endpoint.group(1) == f"https://{self.test_app.name}.fastchargeapi.com/echo1"
        ), "Should show correct endpoint."

        assert "Echo API from /echo1" in result.output, "Should show description."
        assert "Echo API from /echo2" in result.output, "Should show description."
