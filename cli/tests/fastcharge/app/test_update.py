from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.graphql_client import get_client_info
from fastchargeapi_cli.main import fastcharge
from tests.__generated__ import gql_operations as GQL
from tests.utils import create_test_app, create_test_user, login_as_user, logout_user


class TestFastchargeAppUpdate:
    """Test `fastcharge app update`."""

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

    def test_update_app(self):
        update = {
            "description": f"test-app-{uuid4().hex}",
            "repository": f"https://github.com/{uuid4().hex}",
            "homepage": f"https://github.com/{uuid4().hex}",
            "readme": f"https://github.com/{uuid4().hex}/README.md",
            "visibility": "public",
        }
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile",
                self.test_user.pk,
                "app",
                "update",
                self.test_app.name,
                *[f"--{k}={v}" for k, v in update.items()],
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.output
        client, auth = get_client_info(self.test_user.pk)
        app = GQL.verify_app_update(client, self.test_app.pk)

        assert app is not None

        for k, v in update.items():
            assert (
                getattr(app, k) == v
            ), f"Expected .{k} to be updated to '{v}', but got '{getattr(app, k)}'"

    def test_update_app_not_found(self):
        app_name = uuid4().hex
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile",
                self.test_user.pk,
                "app",
                "update",
                app_name,
                "--description=description",
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 1
        assert f'An app with the name "{app_name}" does not exist.' in result.output
