#!python
import os
from pathlib import Path
import textwrap
from subprocess import run
import colorama
import requests

os.environ["TEST"] = "1"

project_root = Path(__file__).parent.parent


def prompt(text: str, pause: bool = False):
    print(colorama.Fore.YELLOW + text + colorama.Fore.RESET)
    if pause:
        input("Press enter to continue...")


prompt(
    """
This test will create an app named "TestApp" using the user "vendor@gmail.com". 
And then it adds an API pointing from "/google" to "https://google.com".
"""
)


def fastchargecli(*args):
    try:
        prompt("Running: fastcharge " + " ".join(args), pause=True)
        return run(
            ["python", "-m", "main", *args], check=True, cwd=project_root / "cli"
        )
    except BaseException as e:
        prompt(
            "Error occured: " + colorama.Fore.RED + str(e) + colorama.Fore.RESET,
            pause=True,
        )


if __name__ == "__main__":
    prompt("Creating an app now... Should succeed.")
    fastchargecli("app", "create", "TestApp")

    prompt("Creating an api... Should succeed.")
    fastchargecli(
        "api",
        "add",
        "--app",
        "TestApp",
        "--path",
        "/google",
        "--destination",
        "https://google.com",
    )

    prompt("Visit http://TestApp.localhost:6001/google", pause=True)
    response = requests.get(
        "http://localhost:6001/google",
        headers={"Host": "TestApp.localhost:6001"},
    )
    print(response)
