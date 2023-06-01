import json
from functools import cache
from pathlib import Path

import requests
import tomli
from packaging.version import parse

URL_PATTERN = "https://testpypi.python.org/pypi/{package}/json"


@cache
def get_latest_version(package, url_pattern=URL_PATTERN):
    """Return version of package on pypi.python.org using json."""
    req = requests.get(url_pattern.format(package=package))
    version = parse("0")
    if req.status_code == requests.codes.ok:
        j = json.loads(req.text.encode(req.encoding or "utf-8"))
        releases = j.get("releases", [])
        for release in releases:
            ver = parse(release)
            if not ver.is_prerelease:
                version = max(version, ver)
    return version


@cache
def get_current_version():
    """Return current version of package."""
    from . import __version__

    return parse(__version__)


def check_version_or_exit():
    """Check if current version is the latest version on pypi.org."""
    current_version = get_current_version()
    latest_version = get_latest_version("fastchargeapi-cli")
    module_path = Path(__file__).parent
    if current_version < latest_version:
        print(
            f"Your version of fastchargeapi-cli is out of date. "
            f"Current version is {current_version}, "
            f"latest version is {latest_version}. "
        )
        print(f"Please run `pip install --upgrade fastchargeapi-cli` to upgrade.")
        print("Package path: ", module_path)
        exit(1)
