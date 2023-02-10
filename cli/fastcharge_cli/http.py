import os
from click import echo
import requests

from .login import read_valid_id_token_from_auth_file
from .config import payment_api_host


class HttpClient:
    def __init__(self):
        self.session = requests.Session()
        id_token = read_valid_id_token_from_auth_file()
        if id_token is None:
            echo("You must be logged in.")
            exit(1)
        self.session.headers["Authorization"] = id_token

    def get(self, url: str, **kwargs):
        return self.session.get(payment_api_host + url, **kwargs)

    def post(self, url: str, **kwargs):
        return self.session.post(payment_api_host + url, **kwargs)

    def put(self, url: str, **kwargs):
        return self.session.put(payment_api_host + url, **kwargs)

    def delete(self, url: str, **kwargs):
        return self.session.delete(payment_api_host + url, **kwargs)
