from enum import Enum
from gql import Client
from gql.transport.requests import RequestsHTTPTransport
import boto3
from requests import Response
from json import dumps as json_dumps


class PredefinedSQSQueue(Enum):
    billing_fifo_queue = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-billing-queue.fifo"
    usage_log_queue = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-usage-log-queue"


class SQSHttpTransport(RequestsHTTPTransport):
    def __init__(
        self,
        url: str,
        queue: PredefinedSQSQueue,
        MessageDeduplicationId: str = None,
        MessageGroupId: str = None,
        **kwargs,
    ):
        super().__init__(url=url, **kwargs)
        self.MessageDeduplicationId = MessageDeduplicationId
        self.MessageGroupId = MessageGroupId
        self.queue = queue

    def connect(self):
        self.session = SQSRequestsSession(
            MessageDeduplicationId=self.MessageDeduplicationId,
            MessageGroupId=self.MessageGroupId,
            queue=self.queue,
        )


class SQSRequestsSession:
    def __init__(
        self,
        queue: PredefinedSQSQueue,
        MessageDeduplicationId: str = None,
        MessageGroupId: str = None,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.MessageDeduplicationId = MessageDeduplicationId
        self.MessageGroupId = MessageGroupId
        self.queue = queue
        self.client = boto3.client("sqs")

    def mount(self):
        pass

    def close(self):
        pass

    def request(
        self,
        method: str,
        url: str,
        json: object = None,
        **kwargs,
    ) -> None:
        response = self.client.send_message(
            QueueUrl=self.queue.value,
            MessageBody=json_dumps(json),
            MessageDeduplicationId=self.MessageDeduplicationId,
            MessageGroupId=self.MessageGroupId,
        )
        resp = Response()
        resp.status_code = 200
        resp._content = b'{"data": {}}'
        return resp


def get_sqs_graphql_client(
    queue: PredefinedSQSQueue,
    dedup_id: str = None,
    group_id: str = None,
) -> Client:
    """Returns a GraphQL client that uses SQS as a transport layer.

    dedup_id: Only for fifo queues. Sets the MessageDeduplicationId for the SQS
    message.

    group_id: Only for fifo queues. Sets the MessageGroupId for the SQS message.
    If the billing is PredefinedSQSQueue.billing_fifo_queue, you need to use the
    user's email as the group_id.

    Effectively, MessageDeduplicationId deduplicates messages with the same ID.
    Messages with the same MessageGroupId are processed in FIFO order.
    """
    return Client(
        transport=SQSHttpTransport(
            url="",
            queue=queue,
            MessageDeduplicationId=dedup_id,
            MessageGroupId=group_id,
        ),
        fetch_schema_from_transport=False,
    )
