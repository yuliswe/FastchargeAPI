from uuid import uuid4

from click.testing import CliRunner
from fastchargeapi_cli.main import fastapi
from tests.__generated__ import gql_operations as GQL
from tests.utils import (
    create_test_app,
    create_test_user,
    get_admin_gqlclient,
    login_as_user,
    logout_user,
)


class TestSubscriptionAdd:
    """Test `fastapi subscription add`"""

    def setup_method(self):
        test_user_email: str = "testuser_" + uuid4().hex + "@gmail_mock.com"
        self.runner = CliRunner()
        self.test_user = create_test_user(test_user_email)
        self.test_app = create_test_app(
            owner=self.test_user.pk, name="test-app-" + uuid4().hex[:50]
        )
        self.pricing = self._create_pricing()
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

    def test_subs_add(self):
        result = self.runner.invoke(
            fastapi,
            [
                f"--profile",
                self.test_user.pk,
                "subscription",
                "add",
                self.test_app.name,
                "--plan",
                self.pricing.name,
            ],
        )
        assert result.exit_code == 0
        assert (
            GQL.verify_user_is_subscribed_to_pricing_plan(
                get_admin_gqlclient(),
                subscriber=self.test_user.pk,
                app=self.test_app.name,
            ).pk
            is not None
        )  # this should not raise not found error
