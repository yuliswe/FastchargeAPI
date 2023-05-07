from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.main import fastcharge
from tests.utils import create_test_app, create_test_user, login_as_user, logout_user


class TestFastchargeAppCreate:
    """Test `fastcharge app create`."""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def test_create_app(self):
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile={self.test_user.pk}",
                "app",
                "create",
                "test-app-" + uuid4().hex[:50],
            ],
        )
        assert result.exit_code == 0

    def test_create_app_exists(self):
        app_name = "test-app-" + uuid4().hex[:50]
        create_test_app(owner=self.test_user.pk, name=app_name)
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile={self.test_user.pk}",
                "app",
                "create",
                app_name,
            ],
            catch_exceptions=False,
        )
        assert result.exit_code != 0
        assert (
            f'An app with the name "{app_name}" has already been registered.'
            in result.output
        ), "Must have error message about existing app"

    def test_create_app_invalid_length(self):
        app_name = "test-app-" + uuid4().hex + uuid4().hex
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile={self.test_user.pk}",
                "app",
                "create",
                app_name,
            ],
            catch_exceptions=False,
        )
        assert result.exit_code != 0
        assert (
            "at most 63 characters" in result.output.lower()
        ), "Must have error message about length"
