#!python
from pathlib import Path
from subprocess import run
from typing import final
from pathos.multiprocessing import ProcessPool
import shutil

project_root = Path(__file__).parent.parent


def launch_local_services():
    """Launch local services for testing."""
    # Launch the local services.
    with ProcessPool(10) as pool:
        result = pool.map(
            lambda fn: fn(),
            [
                launch_graphql_service,
                launch_dynamodb,
                launch_gateway_service,
                launch_payment_service,
                launch_stripe_listen_accept,
                launch_stripe_listen_onboard,
            ],
            chunksize=1,
        )
        print(result)


def launch_dynamodb():
    try:
        shutil.rmtree(Path(project_root / ".docker/dynamodb/test"), ignore_errors=True)
        run(
            "docker compose -f dynamodb.yml up dynamodb-test",
            cwd=project_root,
            shell=True,
        )
    finally:
        run(
            "docker compose -f dynamodb.yml down dynamodb-test",
            cwd=project_root,
            shell=True,
        )
        shutil.rmtree(Path(project_root / ".docker/dynamodb/test"), ignore_errors=True)


def launch_graphql_service():
    run(
        "PORT=4001 TEST=1 npm run watch",
        cwd=project_root / "graphql-service" / "apollo",
        shell=True,
        check=True,
    )


def launch_payment_service():
    run(
        "TEST=1 sam local start-api -p 3001",
        cwd=project_root / "payment-service",
        shell=True,
        check=True,
    )


def launch_stripe_listen_accept():
    run("stripe listen --forward-to localhost:3001/accept", shell=True, check=True)


def launch_stripe_listen_onboard():
    run(
        "stripe listen --forward-to localhost:3001/onboard/accept",
        shell=True,
        check=True,
    )


def launch_gateway_service():
    run(
        'TEST=1 nodemon -e go,graphql -i generated__graphql.go -x "make build && sam local start-api -p 5001"',
        cwd=project_root / "gateway-service",
        shell=True,
        check=True,
    )


if __name__ == "__main__":
    launch_local_services()
