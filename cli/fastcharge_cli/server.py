import logging
import flask
import flask.cli
from multiprocessing.connection import Client
import os

# flask.cli.show_server_banner = lambda *args: None
app = flask.Flask(__name__)


@app.route("/", methods=["GET", "POST", "OPTIONS"])
def home():
    if flask.request.method == "OPTIONS":
        response = flask.Response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response

    socket_port = int(os.environ["FASTCHARGE_SOCKET_PORT"])
    conn = Client(("localhost", socket_port))
    conn.send(
        {
            "json": flask.request.get_json(silent=True),
            "data": flask.request.data,
            "headers": dict(flask.request.headers),
            "method": flask.request.method,
            "url": flask.request.url,
            "authorization": flask.request.authorization,
            "cookies": flask.request.cookies,
        }
    )
    conn.close()
    response = flask.jsonify("Success")
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


# log = logging.getLogger("werkzeug")
# log.disabled = True
# app.logger.disabled = True
