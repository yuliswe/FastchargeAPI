import random
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


class TestFastchargePricingList:
    """Test what commands are available under `fastcharge pricing list`."""

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

    def _create_pricing(self, app: str):
        return GQL.create_pricing(
            get_admin_gqlclient(),
            app=app,
            name=uuid4().hex,
            minMonthlyCharge=str(random.randrange(1_00, 10_00) / 100),
            chargePerRequest=str(random.randrange(1, 10) / 1000),
            freeQuota=random.randint(1, 1000),
            callToAction=uuid4().hex,
            visible=False,
        )

    def test_fastcharge_pricing_list(self):
        pricings = [self._create_pricing(self.test_app.name) for _ in range(3)]
        result = self.runner.invoke(
            fastcharge,
            [
                f"--profile={self.test_user.pk}",
                "pricing",
                "list",
                self.test_app.name,
            ],
            catch_exceptions=False,
        )
        assert result.exit_code == 0, result.stdout
        for pricing in pricings:
            assert pricing.name in result.stdout, "Expect pricing name to be shown"
            assert (
                f"${float(pricing.minMonthlyCharge):.2f} during active month + additional ${pricing.chargePerRequest} per request"
                in result.stdout
            ), "Expect monthly charge to be shown"
            assert (
                pricing.callToAction in result.stdout
            ), "Expect call to action to be shown"
            assert f"First {pricing.freeQuota} requests are free of charge."
