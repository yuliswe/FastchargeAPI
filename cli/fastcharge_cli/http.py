import os
import requests
from .config import payment_api_host


class HttpClient:
    def __init__(self, user_email: str):
        self.session = requests.Session()
        self.session.headers["X-User-Email"] = user_email

    def get(self, url: str, **kwargs):
        return self.session.get(payment_api_host + url, **kwargs)

    def post(self, url: str, **kwargs):
        return self.session.post(payment_api_host + url, **kwargs)

    def put(self, url: str, **kwargs):
        return self.session.put(payment_api_host + url, **kwargs)

    def delete(self, url: str, **kwargs):
        return self.session.delete(payment_api_host + url, **kwargs)
