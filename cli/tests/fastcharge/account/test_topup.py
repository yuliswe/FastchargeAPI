import re
from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.config import base_domain
from fastchargeapi_cli.main import fastcharge
from tests.utils import create_test_user, login_as_user, logout_user


class TestFastchargeAccountTopup:
    """Test `fastcharge account topup`"""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def test_account_topup(self):
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile",
                self.test_user.pk,
                "account",
                "topup",
                "100",
                "--no-browser",
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.stdout
        assert "Please complete payment in browser:" in result.stdout
        match_result = re.search(
            rf"^\s+https://{base_domain}/topup\?amount=(\d+)&jwe=(\w+)&jwt=(\w+)&key=(\w+)",
            result.stdout,
            re.MULTILINE,
        )
        assert (
            match_result is not None
        ), f"Checkout URL should be in the output: {result.stdout=}"
        assert match_result.group(1) == "100", "Amount should be 100"

    def test_account_topup_too_low(self):
        for amount in [0.99, 0, -1]:
            result = self.runner.invoke(
                fastcharge,
                [
                    f"--profile",
                    self.test_user.pk,
                    "account",
                    "topup",
                    "--no-browser",
                    "--",
                    str(amount),
                ],
                catch_exceptions=False,
            )
            assert result.exit_code == 1, result.stdout
            assert (
                "Minimum topup amount is $1." in result.stdout
            ), f"Expected error, got: {result.stdout}"
