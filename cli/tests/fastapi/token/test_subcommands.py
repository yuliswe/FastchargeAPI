import re

from click.testing import CliRunner
from fastchargeapi_cli.main import fastapi


class TestAvailableCommands:
    """Test what commands are available under `fastapi api`."""

    def setup_method(self):
        self.runner = CliRunner()

    def test_account_info(self):
        result = self.runner.invoke(fastapi, ["token"], catch_exceptions=False)
        assert result.exit_code == 0
        commands = ["create", "revoke"]
        for command in commands:
            assert (
                re.search(rf"^\s+{command}\s+", result.output, re.MULTILINE) is not None
            ), f"{command} should be in the output: {result.output=}"
