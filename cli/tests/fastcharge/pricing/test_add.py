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


class TestFastchargePricingAdd:
    """Test what commands are available under `fastcharge pricing add`."""

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

    def test_pricing_add(self):
        plan_name = "test-pricing-" + uuid4().hex[:50]
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile={self.test_user.pk}",
                "pricing",
                "add",
                self.test_app.name,
                "--name",
                plan_name,
                "--monthly-charge",
                "10",
                "--charge-per-request",
                "0.001",
                "--free-quota",
                "1000",
                "--call-to-action",
                "Buy now",
            ],
        )
        assert result.exit_code == 0, result.stdout
        plans = GQL.get_app_pricing(
            get_admin_gqlclient(), appName=self.test_app.name
        ).pricingPlans
        assert len(plans) == 1, f"Expects 1 pricing plan, got {len(plans)}"
        assert plans[0].name == plan_name
        assert plans[0].minMonthlyCharge == "10.0"
        assert plans[0].chargePerRequest == "0.001"
        assert plans[0].freeQuota == 1000
        assert plans[0].callToAction == "Buy now"
        assert plans[0].visible is False
