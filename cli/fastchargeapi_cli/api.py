from dataclasses import dataclass

from blessings import Terminal
from .fastcharge_app import get_app_or_prompt_exit
from .graphql import get_client_info
from gql import gql
import colorama
from click import echo

terminal = Terminal()


@dataclass
class APIInfo:
    path: str
    pk: str
    destination: str
    description: str


def do_api_list(app_name: str):
    client, auth = get_client_info()
    app = get_app_or_prompt_exit(app_name)
    result = [
        client.execute(
            gql(
                """
                query GetAppInfo($app_name: String!) {
                    app(name: $app_name) {
                        name
                        gatewayMode
                        endpoints {
                            pk,
                            path,
                            destination,
                            description,
                        }
                    }
                }
                """
            ),
            variable_values={"app_name": app_name},
        )["app"]
    ]
    for app_i, app in enumerate(result):
        echo(
            terminal.blue
            + terminal.bold
            + f"\"{app['name']}\" endpoints:\n"
            + terminal.normal
        )
        # echo(f"\n Gateway mode: {app['gatewayMode']}\n")
        if app["endpoints"]:
            for endpoint_i, endpoint in enumerate(app["endpoints"]):
                endpoint = APIInfo(**endpoint)
                url = f"https://{app['name']}.fastchargeapi.com{endpoint.path}"
                echo(" ID:\t\t" + endpoint.pk)
                echo(" Endpoint:\t" + f"{url} ~> {endpoint.destination}")
                echo(
                    colorama.Style.DIM
                    + f" {endpoint.description or 'No description.'}"
                    + colorama.Style.RESET_ALL
                )
                echo()
        else:
            echo(colorama.Style.RESET_ALL + "No API available.")
