from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.main import fastcharge
from tests.utils import create_test_app, create_test_user, login_as_user, logout_user


class TestFastchargeAppList:
    """Test `fastcharge app list`."""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def test_app_list(self):
        create_test_app(owner=self.test_user.pk, name="test-app-1-" + uuid4().hex[:50])
        create_test_app(owner=self.test_user.pk, name="test-app-2-" + uuid4().hex[:50])
        result = self.runner.invoke(
            fastcharge,
            [f"--profile={self.test_user.pk}", "app", "list"],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.stdout
        assert (
            "test-app-" in result.stdout
        ), f"Expected 'test-app-1-' in stdout, but got '{result.stdout}'"
        assert (
            "test-app-" in result.stdout
        ), f"Expected 'test-app-2-' in stdout, but got '{result.stdout}'"
