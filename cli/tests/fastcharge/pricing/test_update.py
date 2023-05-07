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


class TestFastchargePricingUpdate:
    """Test what commands are available under `fastcharge pricing update`."""

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

    def _create_pricing(self):
        return GQL.create_pricing(
            get_admin_gqlclient(),
            app=self.test_app.name,
            name=f"test-pricing-{uuid4().hex[:50]}",
            minMonthlyCharge="10",
            chargePerRequest="0.001",
            freeQuota=1000,
            callToAction="Buy now",
            visible=True,
        )

    def test_pricing_update(self):
        pricing = self._create_pricing()
        for opt, prop, val, cmptype in [
            ("--name", "name", "new-name-" + uuid4().hex[:50], str),
            ("--monthly-charge", "minMonthlyCharge", random.randrange(1, 100), float),
            (
                "--charge-per-request",
                "chargePerRequest",
                random.randrange(1, 100) / 1000,
                float,
            ),
            ("--free-quota", "freeQuota", random.randrange(1, 1000), int),
            ("--call-to-action", "callToAction", uuid4().hex[:50], str),
        ]:
            result = self.runner.invoke(
                fastcharge,
                [
                    f"--profile={self.test_user.pk}",
                    "pricing",
                    "update",
                    pricing.pk,
                    opt,
                    str(val),
                ],
                catch_exceptions=False,
            )
            assert result.exit_code == 0, result.stdout
            updated = GQL.get_app_pricing(
                get_admin_gqlclient(), appName=self.test_app.name
            ).pricingPlans[0]
            assert cmptype(getattr(updated, prop)) == cmptype(val)
