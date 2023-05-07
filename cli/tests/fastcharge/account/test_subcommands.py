import re

from click.testing import CliRunner
from fastchargeapi_cli.main import fastcharge


class TestFastchargeAccountAvailableCommands:
    """Test what commands are available under `fastcharge account`."""

    def setup_method(self):
        self.runner = CliRunner()

    def test_account_info(self):
        result = self.runner.invoke(
            fastcharge,
            ["account"],
            catch_exceptions=False,
        )
        assert result.exit_code == 0
        commands = ["info", "topup", "update", "withdraw"]
        for command in commands:
            assert (
                re.search(rf"^\s+{command}\s+", result.output, re.MULTILINE) is not None
            ), f"{command} should be in the output: {result.output=}"
