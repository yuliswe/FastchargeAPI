from click import echo
import requests

from .login import read_or_refresh_auth_file


class HttpClient:
    def __init__(self):
        self.session = requests.Session()
        auth = read_or_refresh_auth_file()
        if auth is None:
            echo("You must be logged in.")
            exit(1)
        self.session.headers["Authorization"] = auth.id_token

    def get(self, url: str, **kwargs):
        return self.session.get(url, **kwargs)

    def post(self, url: str, **kwargs):
        return self.session.post(url, **kwargs)

    def put(self, url: str, **kwargs):
        return self.session.put(url, **kwargs)

    def delete(self, url: str, **kwargs):
        return self.session.delete(url, **kwargs)
