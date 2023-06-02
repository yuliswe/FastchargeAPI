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


class TestFastchargeAPIUpdate:
    """Test `fastcharge api add`."""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        self.test_app = create_test_app(
            owner=self.test_user.pk, name="test-app-" + uuid4().hex[:50]
        )
        self.endpoint = self._create_endpoint()
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def _create_endpoint(self):
        return GQL.create_endpoint(
            get_admin_gqlclient(),
            app=self.test_app.name,
            path="/echo",
            method=GQL.HTTPMethod.POST,
            destination="https://example.devfastchargeapi.com",
            description="Echo API",
        )

    def test_update(self):
        for cmptype, opt, prop, val in [
            (GQL.HTTPMethod, "--method", "method", "PUT"),
            (str, "--path", "path", uuid4().hex[:10]),
            (str, "--destination", "destination", uuid4().hex[:10]),
            (str, "--description", "description", uuid4().hex[:10]),
        ]:
            result = self.runner.invoke(
                fastcharge,
                [
                    f"--profile={self.test_user.pk}",
                    "api",
                    "update",
                    self.endpoint.pk,
                    opt,
                    val,
                ],
            )
            assert result.exit_code == 0, result.stdout
            new_endpoint = GQL.verify_api_update(
                get_admin_gqlclient(), self.endpoint.pk
            )
            assert cmptype(getattr(new_endpoint, prop)) == cmptype(val)
