import time
from uuid import uuid4

import tests.__generated__.gql_operations as GQL
from click.testing import CliRunner
from fastchargeapi_cli.main import fastcharge
from tests.utils import (
    add_money_for_user,
    create_test_user,
    get_admin_gqlclient,
    login_as_user,
    logout_user,
)


class TestFastchargeAccountWithdraw:
    """Test `fastcharge account withdraw`"""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        login_as_user(self.test_user.pk)

    def teardown_method(self):
        logout_user(self.test_user.pk)

    def test_account_withdraw_ok(self):
        """Add $10, then withdraw $3."""
        add_money_for_user(self.test_user.pk, "10.00")
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile",
                self.test_user.pk,
                "account",
                "withdraw",
                "3",
            ],
            catch_exceptions=False,
            input="y\n",
        )
        assert result.exit_code == 0, result.output

        new_result = None
        for attempt in range(10):
            new_result = GQL.get_user_account_balance(
                get_admin_gqlclient(), user=self.test_user.pk
            )
            if float(new_result.balance) == float(7):
                break
            print(f"Waiting for balance update ({attempt}s):", new_result.balance)
            time.sleep(1)
        assert new_result is not None, "Failed to get user account balance"
        assert float(new_result.balance) == 7, "Failed to withdraw money"

    def test_account_withdraw_no_money(self):
        """Withdraw $10, but user has no money."""
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile",
                self.test_user.pk,
                "account",
                "withdraw",
                "10",
            ],
            catch_exceptions=False,
            input="y\n",
        )
        assert result.exit_code == 1, "Should exit with error"
        assert (
            "Your account only has a balance of $0.00. Cannot withdraw $10.00"
            in result.output
        )

    def test_account_withdraw_insufficient(self):
        """Withdraw $10, but user has $1."""
        add_money_for_user(self.test_user.pk, "1.00")
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile",
                self.test_user.pk,
                "account",
                "withdraw",
                "10",
            ],
            catch_exceptions=False,
            input="y\n",
        )
        assert result.exit_code == 1, "Should exit with error"
        assert (
            "Your account only has a balance of $1.00. Cannot withdraw $10.00"
            in result.output
        )

    def test_account_withdraw_too_low(self):
        """Withdraw lower than the minimum of $3."""
        add_money_for_user(self.test_user.pk, "10")
        for attempt in [2.99, 1, 0, -0.1, -10]:
            result = self.runner.invoke(
                fastcharge,
                [
                    f"--profile",
                    self.test_user.pk,
                    "account",
                    "withdraw",
                    "--",
                    str(attempt),
                ],
                catch_exceptions=False,
                input="y\n",
            )
            assert result.exit_code == 1, "Should exit with error"
            assert "Minimum withdrawal amount is $3.00." in result.output
