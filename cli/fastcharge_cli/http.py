import os
import requests


class HttpClient:
    def __init__(self, user_email: str):
        self.session = requests.Session()
        self.session.headers["X-User-Email"] = user_email

        if os.environ.get("TEST") == "1":
            self.host = "http://localhost:3001/"
        else:
            self.host = "http://localhost:3000/"

    def get(self, url: str, **kwargs):
        return self.session.get(self.host + url, **kwargs)

    def post(self, url: str, **kwargs):
        return self.session.post(self.host + url, **kwargs)

    def put(self, url: str, **kwargs):
        return self.session.put(self.host + url, **kwargs)

    def delete(self, url: str, **kwargs):
        return self.session.delete(self.host + url, **kwargs)
