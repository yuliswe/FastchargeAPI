import re
from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.main import fastcharge
from tests.utils import create_test_user, login_as_user, logout_user


class TestFastchargeAccountInfo:
    """Test `fastcharge account info`"""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def test_account_info(self):
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile",
                self.test_user.pk,
                "account",
                "info",
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0

        account = re.search(r"^Account:\s+(\S+)", result.output, re.MULTILINE)
        assert account is not None, f"Account should be in the output: {result.output=}"
        assert account.group(1) == self.test_user.email, "Account email should match"

        author = re.search(r"^Author:\s+(\S+)", result.output, re.MULTILINE)
        assert author is not None, f"Author should be in the output: {result.output=}"
        assert author.group(1) != ""

        balance = re.search(
            r"^Your account balance is:\s+([\$\d\.]+)", result.output, re.MULTILINE
        )
        assert balance is not None, f"Balance should be in the output: {result.output=}"
        assert balance.group(1) == "$0.00", "Account balance should be $0.00"
