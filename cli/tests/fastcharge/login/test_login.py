from uuid import uuid4

import pytest
from click.testing import CliRunner
from fastchargeapi_cli.auth_file import get_auth_file_path
from fastchargeapi_cli.main import fastcharge
from tests.utils import create_test_user, logout_user


class TestLogin:
    """Test `fastcharge login`"""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    @pytest.mark.skip("Not sure how to test this")
    def test_login(self):
        result = self.runner.invoke(
            fastcharge,
            [f"--profile", self.test_user.pk, "login"],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.output
        assert f"Login successful for profile '{self.test_user.pk}'" in result.output
        assert get_auth_file_path(self.test_user.pk).exists()
