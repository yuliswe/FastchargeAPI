from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.auth_file import get_auth_file_path
from fastchargeapi_cli.main import fastapi
from tests.utils import create_test_user, login_as_user, logout_user


class TestLogout:
    """Test `fastapi logout`"""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def test_logout(self):
        assert get_auth_file_path(self.test_user.pk).exists()
        result = self.runner.invoke(
            fastapi,
            [
                f"--profile",
                self.test_user.pk,
                "logout",
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0
        assert get_auth_file_path(self.test_user.pk).exists() is False
