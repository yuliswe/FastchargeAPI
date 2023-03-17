# from contextlib import contextmanager
# import logging
# from socket import socket
# import flask
# import flask.cli
# from typing import Generator, Optional
# import flask
# from multiprocessing.connection import Listener, Connection, Client
# from pathos.multiprocessing import ProcessPool
# from dataclasses import dataclass
# from flask_cors import CORS

# app = flask.Flask(__name__)
# CORS(app)


# @dataclass
# class LocalServerResponse:
#     json: Optional[dict]
#     data: bytes
#     headers: dict[str, str]
#     method: str
#     url: str
#     authorization: str
#     cookies: str


# client_socket_conn = None


# @app.route("/", methods=["GET", "POST", "OPTIONS"])
# def home():
#     if flask.request.method == "OPTIONS":
#         response = flask.Response()
#         response.headers.add("Access-Control-Allow-Origin", "*")
#         response.headers.add("Access-Control-Allow-Headers", "*")
#         response.headers.add("Access-Control-Allow-Methods", "*")
#         return response

#     global client_socket_conn
#     client_socket_conn.send(
#         LocalServerResponse(
#             json=flask.request.get_json(silent=True),
#             data=flask.request.data,
#             headers=dict(flask.request.headers),
#             method=flask.request.method,
#             url=flask.request.url,
#             authorization=flask.request.authorization,
#             cookies=flask.request.cookies,
#         )
#     )
#     response = flask.jsonify("Ok")
#     response.headers.add("Access-Control-Allow-Origin", "*")
#     response.headers.add("Access-Control-Allow-Headers", "*")
#     response.headers.add("Access-Control-Allow-Methods", "*")
#     return response


# def start_flask_server(socket_port, host, port):
#     # Completely silence the flask server's logging
#     flask.cli.show_server_banner = lambda *args: None
#     log = logging.getLogger("werkzeug")
#     log.disabled = True
#     app.logger.disabled = True
#     with Client(("127.0.0.1", socket_port)) as conn:
#         global client_socket_conn
#         client_socket_conn = conn
#         app.run(host=host, port=port)


# def find_free_port() -> int:
#     with socket() as s:
#         s.bind(("", 0))
#         return int(s.getsockname()[1])


# @contextmanager
# def start_local_server(
#     listen_on: Optional[int] = None,
# ) -> Generator[tuple[int, Connection], None, None]:
#     """Spin up a local server that accepts an arbitaray json POST request, and
#     start listening. The server listens to one request and terminates itself.

#     Use this function as a context manager, and it yields a tuple of (port, conn).

#     port is the port that the local server is listening on.
#     conn is the connection object of the socket. Use conn.recv() to get the request.

#     Example:
#     with start_local_server() as (port, conn):
#         reesult = conn.recv()
#     """
#     with ProcessPool(1) as pool:
#         try:
#             socket_port = find_free_port()
#             if listen_on is None:
#                 listen_on = find_free_port()
#             # Start the local server in a separate process
#             pool.apipe(
#                 start_flask_server, socket_port, host="127.0.0.1", port=listen_on
#             )
#             # Start a socket to listen for data from the local server process
#             conn = Listener(
#                 ("127.0.0.1", socket_port)
#             ).accept()  # blocks until a connection is made
#             yield listen_on, conn
#         finally:
#             # Stop the local server
#             conn.close()
#             pool.terminate()
