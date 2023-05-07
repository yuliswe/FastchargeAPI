import re

from click.testing import CliRunner
from fastchargeapi_cli.main import fastcharge


class TestFastchargeAPIAvailableCommands:
    """Test what commands are available under `fastcharge api`."""

    def setup_method(self):
        self.runner = CliRunner()

    def test_fastcharge_api(self):
        result = self.runner.invoke(
            fastcharge,
            ["api"],
            catch_exceptions=False,
        )
        assert result.exit_code == 0
        commands = ["add", "remove", "list", "update"]
        for command in commands:
            assert (
                re.search(rf"^\s+{command}\s+", result.output, re.MULTILINE) is not None
            ), f"{command} should be in the output: {result.output=}"
